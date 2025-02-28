import { getHeight, getWidth } from '@js/core/utils/size';
import $ from '@js/core/renderer';
// @ts-expect-error
import { grep } from '@js/core/utils/common';
import { each } from '@js/core/utils/iterator';
import { isDefined } from '@js/core/utils/type';
import { when, Deferred } from '@js/core/utils/deferred';
import gridCoreUtils from '../module_utils';

const MASTER_DETAIL_CELL_CLASS = 'dx-master-detail-cell';
const MASTER_DETAIL_ROW_CLASS = 'dx-master-detail-row';
const CELL_FOCUS_DISABLED_CLASS = 'dx-cell-focus-disabled';
const ROW_LINES_CLASS = 'dx-row-lines';

export const masterDetailModule = {
  defaultOptions() {
    return {
      masterDetail: {
        enabled: false,
        autoExpandAll: false,
        template: null,
      },
    };
  },
  extenders: {
    controllers: {
      columns: {
        _getExpandColumnsCore() {
          const expandColumns = this.callBase();

          if (this.option('masterDetail.enabled')) {
            expandColumns.push({
              type: 'detailExpand',
              cellTemplate: gridCoreUtils.getExpandCellTemplate(),
            });
          }
          return expandColumns;
        },
      },
      data: (function () {
        const initMasterDetail = function (that) {
          that._expandedItems = [];
          that._isExpandAll = that.option('masterDetail.autoExpandAll');
        };

        return {
          init() {
            const that = this;

            initMasterDetail(that);
            that.callBase();
          },
          expandAll(groupIndex) {
            const that = this;

            if (groupIndex < 0) {
              that._isExpandAll = true;
              that._expandedItems = [];
              that.updateItems();
            } else {
              that.callBase.apply(that, arguments);
            }
          },
          collapseAll(groupIndex) {
            const that = this;

            if (groupIndex < 0) {
              that._isExpandAll = false;
              that._expandedItems = [];
              that.updateItems();
            } else {
              that.callBase.apply(that, arguments);
            }
          },
          isRowExpanded(key) {
            const that = this;
            const expandIndex = gridCoreUtils.getIndexByKey(key, that._expandedItems);

            if (Array.isArray(key)) {
              return that.callBase.apply(that, arguments);
            }
            return !!(that._isExpandAll ^ (expandIndex >= 0 && that._expandedItems[expandIndex].visible));
          },
          _getRowIndicesForExpand(key) {
            const rowIndex = this.getRowIndexByKey(key);

            return [rowIndex, rowIndex + 1];
          },
          _changeRowExpandCore(key) {
            const that = this;

            let result;
            if (Array.isArray(key)) {
              result = that.callBase.apply(that, arguments);
            } else {
              const expandIndex = gridCoreUtils.getIndexByKey(key, that._expandedItems);
              if (expandIndex >= 0) {
                const { visible } = that._expandedItems[expandIndex];

                that._expandedItems[expandIndex].visible = !visible;
              } else {
                that._expandedItems.push({ key, visible: true });
              }

              that.updateItems({
                changeType: 'update',
                rowIndices: that._getRowIndicesForExpand(key),
              });

              // @ts-expect-error
              result = new Deferred().resolve();
            }

            return result;
          },
          _processDataItem(data, options) {
            const that = this;
            const dataItem = that.callBase.apply(that, arguments);

            dataItem.isExpanded = that.isRowExpanded(dataItem.key);

            if (options.detailColumnIndex === undefined) {
              options.detailColumnIndex = -1;
              each(options.visibleColumns, (index, column) => {
                if (column.command === 'expand' && !isDefined(column.groupIndex)) {
                  options.detailColumnIndex = index;
                  return false;
                }

                return undefined;
              });
            }
            if (options.detailColumnIndex >= 0) {
              dataItem.values[options.detailColumnIndex] = dataItem.isExpanded;
            }
            return dataItem;
          },
          _processItems(items, change) {
            const that = this;
            const { changeType } = change;
            const result: any[] = [];

            items = that.callBase.apply(that, arguments);

            if (changeType === 'loadingAll') {
              return items;
            }

            if (changeType === 'refresh') {
              that._expandedItems = grep(that._expandedItems, (item) => item.visible);
            }

            each(items, (index, item) => {
              result.push(item);
              const expandIndex = gridCoreUtils.getIndexByKey(item.key, that._expandedItems);

              if (item.rowType === 'data' && (item.isExpanded || expandIndex >= 0) && !item.isNewRow) {
                result.push({
                  visible: item.isExpanded,
                  rowType: 'detail',
                  key: item.key,
                  data: item.data,
                  values: [],
                });
              }
            });

            return result;
          },
          optionChanged(args) {
            const that = this;
            let isEnabledChanged;
            let isAutoExpandAllChanged;

            if (args.name === 'masterDetail') {
              args.name = 'dataSource';

              // eslint-disable-next-line default-case
              switch (args.fullName) {
                case 'masterDetail': {
                  const value = args.value || {};
                  const previousValue = args.previousValue || {};
                  isEnabledChanged = value.enabled !== previousValue.enabled;
                  isAutoExpandAllChanged = value.autoExpandAll !== previousValue.autoExpandAll;
                  break;
                }
                case 'masterDetail.template': {
                  initMasterDetail(that);
                  break;
                }
                case 'masterDetail.enabled':
                  isEnabledChanged = true;
                  break;

                case 'masterDetail.autoExpandAll':
                  isAutoExpandAllChanged = true;
                  break;
              }
              if (isEnabledChanged || isAutoExpandAllChanged) {
                initMasterDetail(that);
              }
            }
            that.callBase(args);
          },
        };
      }()),
      resizing: {
        fireContentReadyAction() {
          this.callBase.apply(this, arguments);

          this._updateParentDataGrids(this.component.$element());
        },
        _updateParentDataGrids($element) {
          const $masterDetailRow = $element.closest(`.${MASTER_DETAIL_ROW_CLASS}`);

          if ($masterDetailRow.length) {
            when(this._updateMasterDataGrid($masterDetailRow, $element)).done(() => {
              this._updateParentDataGrids($masterDetailRow.parent());
            });
          }
        },
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        _updateMasterDataGrid($masterDetailRow, $detailElement) {
          const masterRowOptions = $($masterDetailRow).data('options');
          const masterDataGrid = $($masterDetailRow).closest(`.${this.getWidgetContainerClass()}`).parent().data('dxDataGrid');

          if (masterRowOptions && masterDataGrid) {
            return this._updateMasterDataGridCore(masterDataGrid, masterRowOptions);
          }
        },
        _updateMasterDataGridCore(masterDataGrid, masterRowOptions) {
          const d = Deferred();

          if (masterDataGrid.getView('rowsView').isFixedColumns()) {
            this._updateFixedMasterDetailGrids(masterDataGrid, masterRowOptions.rowIndex, $(masterRowOptions.rowElement))
              .done(d.resolve);
          } else {
            if (masterDataGrid.option('scrolling.useNative') === true) {
              masterDataGrid.updateDimensions().done(() => d.resolve(true));
              return;
            }

            const scrollable = masterDataGrid.getScrollable();

            if (scrollable) {
              // T607490
              scrollable?.update().done(() => d.resolve());
            } else {
              d.resolve();
            }
          }

          return d.promise();
        },
        _updateFixedMasterDetailGrids(masterDataGrid, masterRowIndex, $detailElement) {
          const d = Deferred();
          const $rows = $(masterDataGrid.getRowElement(masterRowIndex));
          const $tables = $(masterDataGrid.getView('rowsView').getTableElements());
          const rowsNotEqual = $rows?.length === 2 && getHeight($rows.eq(0)) !== getHeight($rows.eq(1));
          const tablesNotEqual = $tables?.length === 2 && getHeight($tables.eq(0)) !== getHeight($tables.eq(1));

          if (rowsNotEqual || tablesNotEqual) {
            const detailElementWidth = getWidth($detailElement);
            masterDataGrid.updateDimensions().done(() => {
              const isDetailHorizontalScrollCanBeShown = this.option('columnAutoWidth') && masterDataGrid.option('scrolling.useNative') === true;
              const isDetailGridWidthChanged = isDetailHorizontalScrollCanBeShown && detailElementWidth !== getWidth($detailElement);

              if (isDetailHorizontalScrollCanBeShown && isDetailGridWidthChanged) {
                this.updateDimensions().done(() => d.resolve(true));
              } else {
                d.resolve(true);
              }
            });

            return d.promise();
          }

          return Deferred().resolve();
        },
        _toggleBestFitMode(isBestFit) {
          this.callBase.apply(this, arguments);
          if (this.option('masterDetail.template')) {
            const $rowsTable = this._rowsView.getTableElement();
            if ($rowsTable) {
              $rowsTable
                .find('.dx-master-detail-cell')
                .css('maxWidth', isBestFit ? 0 : '');
            }
          }
        },
      },
    },
    views: {
      rowsView: (function () {
        return {
          _getCellTemplate(options) {
            const that = this;
            const { column } = options;
            const editingController = that.getController('editing');
            const isEditRow = editingController && editingController.isEditRow(options.rowIndex);
            let template;

            if (column.command === 'detail' && !isEditRow) {
              template = that.option('masterDetail.template') || { allowRenderToDetachedContainer: false, render: that._getDefaultTemplate(column) };
            } else {
              template = that.callBase.apply(that, arguments);
            }

            return template;
          },

          _isDetailRow(row) {
            return row && row.rowType && row.rowType.indexOf('detail') === 0;
          },

          _createRow(row) {
            const $row = this.callBase.apply(this, arguments);

            if (row && this._isDetailRow(row)) {
              this.option('showRowLines') && $row.addClass(ROW_LINES_CLASS);
              $row.addClass(MASTER_DETAIL_ROW_CLASS);

              if (isDefined(row.visible)) {
                $row.toggle(row.visible);
              }
            }
            return $row;
          },

          _renderCells($row, options) {
            const { row } = options;
            let $detailCell;
            const visibleColumns = this._columnsController.getVisibleColumns();

            if (row.rowType && this._isDetailRow(row)) {
              if (this._needRenderCell(0, options.columnIndices)) {
                $detailCell = this._renderCell($row, {
                  value: null,
                  row,
                  rowIndex: row.rowIndex,
                  column: { command: 'detail' },
                  columnIndex: 0,
                  change: options.change,
                });

                $detailCell
                  .addClass(CELL_FOCUS_DISABLED_CLASS)
                  .addClass(MASTER_DETAIL_CELL_CLASS)
                  .attr('colSpan', visibleColumns.length);
              }
            } else {
              this.callBase.apply(this, arguments);
            }
          },
        };
      }()),
    },
  },
};
