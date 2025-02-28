import $ from '@js/core/renderer';
import eventsEngine from '@js/events/core/events_engine';
import { name as clickEventName } from '@js/events/click';
import { isDefined } from '@js/core/utils/type';
import { extend } from '@js/core/utils/extend';
import sortingMixin from '@js/ui/grid_core/ui.grid_core.sorting_mixin';
import messageLocalization from '@js/localization/message';
import { addNamespace, isCommandKeyPressed } from '@js/events/utils/index';

const COLUMN_HEADERS_VIEW_NAMESPACE = 'dxDataGridColumnHeadersView';

const ColumnHeadersViewSortingExtender = extend({}, sortingMixin, {
  _createRow(row) {
    const $row = this.callBase(row);

    if (row.rowType === 'header') {
      eventsEngine.on($row, addNamespace(clickEventName, COLUMN_HEADERS_VIEW_NAMESPACE), 'td', this.createAction((e) => {
        this._processHeaderAction(e.event, $row);
      }));
    }

    return $row;
  },

  _processHeaderAction(event, $row) {
    if ($(event.currentTarget).parent().get(0) !== $row.get(0)) {
      return;
    }
    const that = this;
    let keyName: any = null;
    const $cellElementFromEvent = $(event.currentTarget);
    const rowIndex = $cellElementFromEvent.parent().index();
    let columnIndex = -1;
    // eslint-disable-next-line array-callback-return
    [].slice.call(that.getCellElements(rowIndex)).some(($cellElement, index) => {
      if ($cellElement === $cellElementFromEvent.get(0)) {
        columnIndex = index;
        return true;
      }

      return undefined;
    });
    const visibleColumns = that._columnsController.getVisibleColumns(rowIndex);
    const column = visibleColumns[columnIndex];
    const editingController = that.getController('editing');
    const editingMode = that.option('editing.mode');
    const isCellEditing = editingController && editingController.isEditing() && (editingMode === 'batch' || editingMode === 'cell');

    if (isCellEditing || !that._isSortableElement($(event.target))) {
      return;
    }

    if (column && !isDefined(column.groupIndex) && !column.command) {
      if (event.shiftKey) {
        keyName = 'shift';
      } else if (isCommandKeyPressed(event)) {
        keyName = 'ctrl';
      }
      setTimeout(() => {
        that._columnsController.changeSortOrder(column.index, keyName);
      });
    }
  },

  _renderCellContent($cell, options) {
    const that = this;
    const { column } = options;

    if (!column.command && options.rowType === 'header') {
      that._applyColumnState({
        name: 'sort',
        rootElement: $cell,
        column,
        showColumnLines: that.option('showColumnLines'),
      });
    }

    this.callBase.apply(this, arguments);
  },

  _columnOptionChanged(e) {
    const { changeTypes } = e;

    if (changeTypes.length === 1 && changeTypes.sorting) {
      this._updateIndicators('sort');
      return;
    }

    this.callBase(e);
  },

  optionChanged(args) {
    const that = this;

    switch (args.name) {
      case 'sorting':
        that._invalidate();
        args.handled = true;
        break;
      default:
        that.callBase(args);
    }
  },
});

const HeaderPanelSortingExtender = extend({}, sortingMixin, {
  _createGroupPanelItem($rootElement, groupColumn) {
    const that = this;
    // @ts-expect-error
    const $item = that.callBase(...arguments);

    eventsEngine.on($item, addNamespace(clickEventName, 'dxDataGridHeaderPanel'), that.createAction(() => {
      that._processGroupItemAction(groupColumn.index);
    }));

    that._applyColumnState({
      name: 'sort',
      rootElement: $item,
      column: {
        alignment: that.option('rtlEnabled') ? 'right' : 'left',
        allowSorting: groupColumn.allowSorting,
        sortOrder: groupColumn.sortOrder === 'desc' ? 'desc' : 'asc',
      },
      showColumnLines: true,
    });

    return $item;
  },

  _processGroupItemAction(groupColumnIndex) {
    setTimeout(() => this.getController('columns').changeSortOrder(groupColumnIndex));
  },

  optionChanged(args) {
    const that = this;

    switch (args.name) {
      case 'sorting':
        that._invalidate();
        args.handled = true;
        break;
      default:
        that.callBase(args);
    }
  },
});

export const sortingModule = {
  defaultOptions() {
    return {
      sorting: {
        mode: 'single',
        ascendingText: messageLocalization.format('dxDataGrid-sortingAscendingText'),
        descendingText: messageLocalization.format('dxDataGrid-sortingDescendingText'),
        clearText: messageLocalization.format('dxDataGrid-sortingClearText'),
        showSortIndexes: true,
      },
    };
  },
  extenders: {
    views: {
      columnHeadersView: ColumnHeadersViewSortingExtender,
      headerPanel: HeaderPanelSortingExtender,
    },
  },
};
