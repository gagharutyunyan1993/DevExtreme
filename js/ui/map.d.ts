import {
    DxPromise,
} from '../core/utils/deferred';

import {
  EventInfo,
  NativeEventInfo,
  InitializedEventInfo,
  ChangedOptionInfo,
} from '../events/index';

import Widget, {
    WidgetOptions,
} from './widget/ui.widget';

/** @public */
export type MapProvider = 'bing' | 'google' | 'googleStatic';
/** @public */
export type RouteMode = 'driving' | 'walking';
/** @public */
export type MapType = 'hybrid' | 'roadmap' | 'satellite';

/** @public */
export type ClickEvent = NativeEventInfo<dxMap, MouseEvent | PointerEvent>;

/** @public */
export type DisposingEvent = EventInfo<dxMap>;

/** @public */
export type InitializedEvent = InitializedEventInfo<dxMap>;

/** @public */
export type MarkerAddedEvent = EventInfo<dxMap> & {
  readonly options: any;
  originalMarker: any;
};

/** @public */
export type MarkerRemovedEvent = EventInfo<dxMap> & {
  readonly options?: any;
};

/** @public */
export type OptionChangedEvent = EventInfo<dxMap> & ChangedOptionInfo;

/** @public */
export type ReadyEvent = EventInfo<dxMap> & {
  originalMap: any;
};

/** @public */
export type RouteAddedEvent = EventInfo<dxMap> & {
  readonly options: any;
  originalRoute: any;
};

/** @public */
export type RouteRemovedEvent = EventInfo<dxMap> & {
  readonly options?: any;
};

/**
 * @public
 * @namespace DevExpress.ui
 */
export interface MapLocation {
    /**
     * @docid
     * @default 0
     * @public
     */
    lat: number;
    /**
     * @docid
     * @default 0
     * @public
     */
    lng: number;
}

/**
 * @deprecated use Properties instead
 * @namespace DevExpress.ui
 */
export interface dxMapOptions extends WidgetOptions<dxMap> {
    /**
     * @docid
     * @default { bing: '', google: '', googleStatic: '' }
     * @public
     */
    apiKey?: string | {
      /**
       * @docid
       * @default ""
       */
      bing?: string;
      /**
       * @docid
       * @default ""
       */
      google?: string;
      /**
       * @docid
       * @default ""
       */
      googleStatic?: string;
    };
    /**
     * @docid
     * @default true
     * @public
     */
    autoAdjust?: boolean;
    /**
     * @type Object|string|Array<number>
     * @docid
     * @fires dxMapOptions.onOptionChanged
     * @inherits MapLocation
     * @public
     */
    center?: any | string | Array<number>;
    /**
     * @docid
     * @default false
     * @public
     */
    controls?: boolean;
    /**
     * @docid
     * @default true &for(desktop)
     * @public
     */
    focusStateEnabled?: boolean;
    /**
     * @docid
     * @default 300
     * @public
     */
    height?: number | string | (() => number | string);
    /**
     * @docid
     * @public
     */
    markerIconSrc?: string;
    /**
     * @docid
     * @fires dxMapOptions.onMarkerAdded
     * @fires dxMapOptions.onMarkerRemoved
     * @public
     */
    markers?: Array<{
      /**
       * @docid
       */
      iconSrc?: string;
      /**
       * @type Object|string|Array<number>
       * @docid
       * @inherits MapLocation
       */
      location?: any | string | Array<number>;
      /**
       * @docid
       */
      onClick?: Function;
      /**
       * @docid
       */
      tooltip?: string | {
        /**
         * @docid
         * @default false
         */
        isShown?: boolean;
        /**
         * @docid
         */
        text?: string;
      };
    }>;
    /**
     * @docid
     * @default null
     * @type function
     * @type_function_param1 e:object
     * @type_function_param1_field event:event
     * @type_function_param1_field component:dxMap
     * @action
     * @public
     */
    onClick?: ((e: ClickEvent) => void) | string;
    /**
     * @docid
     * @default null
     * @type_function_param1 e:object
     * @type_function_param1_field options:object
     * @type_function_param1_field originalMarker:object
     * @type_function_param1_field component:dxMap
     * @action
     * @public
     */
    onMarkerAdded?: ((e: MarkerAddedEvent) => void);
    /**
     * @docid
     * @default null
     * @type_function_param1 e:object
     * @type_function_param1_field options:object
     * @type_function_param1_field component:dxMap
     * @action
     * @public
     */
    onMarkerRemoved?: ((e: MarkerRemovedEvent) => void);
    /**
     * @docid
     * @default null
     * @type_function_param1 e:object
     * @type_function_param1_field originalMap:object
     * @type_function_param1_field component:dxMap
     * @action
     * @public
     */
    onReady?: ((e: ReadyEvent) => void);
    /**
     * @docid
     * @default null
     * @type_function_param1 e:object
     * @type_function_param1_field options:object
     * @type_function_param1_field originalRoute:object
     * @type_function_param1_field component:dxMap
     * @action
     * @public
     */
    onRouteAdded?: ((e: RouteAddedEvent) => void);
    /**
     * @docid
     * @default null
     * @type_function_param1 e:object
     * @type_function_param1_field options:object
     * @type_function_param1_field component:dxMap
     * @action
     * @public
     */
    onRouteRemoved?: ((e: RouteRemovedEvent) => void);
    /**
     * @docid
     * @default "google"
     * @public
     */
    provider?: MapProvider;
    /**
     * @docid
     * @fires dxMapOptions.onRouteAdded
     * @fires dxMapOptions.onRouteRemoved
     * @public
     */
    routes?: Array<{
      /**
       * @docid
       * @default '#0000FF'
       */
      color?: string;
      /**
       * @docid
       * @inherits MapLocation
       * @type Array<object>
       */
      locations?: Array<any>;
      /**
       * @docid
       * @default 'driving'
       */
      mode?: RouteMode;
      /**
       * @docid
       * @default 0.5
       */
      opacity?: number;
      /**
       * @docid
       * @default 5
       */
      weight?: number;
    }>;
    /**
     * @docid
     * @default "roadmap"
     * @public
     */
    type?: MapType;
    /**
     * @docid
     * @default 300
     * @public
     */
    width?: number | string | (() => number | string);
    /**
     * @docid
     * @default 1
     * @fires dxMapOptions.onOptionChanged
     * @public
     */
    zoom?: number;
}
/**
 * @docid
 * @inherits Widget
 * @namespace DevExpress.ui
 * @public
 */
export default class dxMap extends Widget<dxMapOptions> {
    /**
     * @docid
     * @publicName addMarker(markerOptions)
     * @param1 markerOptions:Object|Array<Object>
     * @return Promise<Object>
     * @public
     */
    addMarker(markerOptions: any | Array<any>): DxPromise<any>;
    /**
     * @docid
     * @publicName addRoute(routeOptions)
     * @param1 options:object|Array<Object>
     * @return Promise<Object>
     * @public
     */
    addRoute(options: any | Array<any>): DxPromise<any>;
    /**
     * @docid
     * @publicName removeMarker(marker)
     * @param1 marker:Object|number|Array<Object>
     * @return Promise<void>
     * @public
     */
    removeMarker(marker: any | number | Array<any>): DxPromise<void>;
    /**
     * @docid
     * @publicName removeRoute(route)
     * @param1 route:object|number|Array<Object>
     * @return Promise<void>
     * @public
     */
    removeRoute(route: any | number | Array<any>): DxPromise<void>;
}

/** @public */
export type Properties = dxMapOptions;

/** @deprecated use Properties instead */
export type Options = dxMapOptions;
