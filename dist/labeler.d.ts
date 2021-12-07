import Point from "@mapbox/point-geometry";
import { PreparedTile } from "./view";
import { Bbox } from "./tilecache";
import RBush from "rbush";
import { LabelSymbolizer, DrawExtra } from "./symbolizer";
import { Filter } from "./painter";
declare type TileInvalidationCallback = (tiles: Set<string>) => void;
export interface Label {
    anchor: Point;
    bboxes: Bbox[];
    draw: (ctx: any, drawExtra?: DrawExtra) => void;
    deduplicationKey?: string;
    deduplicationDistance?: number;
}
export interface IndexedLabel {
    anchor: Point;
    bboxes: Bbox[];
    draw: (ctx: any) => void;
    order: number;
    tileKey: string;
    deduplicationKey?: string;
    deduplicationDistance?: number;
}
export interface Layout {
    index: Index;
    order: number;
    scratch: any;
    zoom: number;
    overzoom: number;
}
export interface LabelRule {
    id?: string;
    minzoom?: number;
    maxzoom?: number;
    dataLayer: string;
    symbolizer: LabelSymbolizer;
    filter?: Filter;
    visible?: boolean;
    sort?: (a: any, b: any) => number;
}
export declare const covering: (display_zoom: number, tile_width: number, bbox: Bbox) => {
    display: string;
    key: string;
}[];
export declare class Index {
    tree: RBush;
    current: Map<string, Set<IndexedLabel>>;
    dim: number;
    constructor(dim: number);
    has(tileKey: string): boolean;
    size(): number;
    keys(): IterableIterator<string>;
    searchBbox(bbox: Bbox, order: number): Set<IndexedLabel>;
    searchLabel(label: Label, order: number): Set<IndexedLabel>;
    bboxCollides(bbox: Bbox, order: number): boolean;
    labelCollides(label: Label, order: number): boolean;
    deduplicationCollides(label: Label): boolean;
    insert(label: Label, order: number, tileKey: string): void;
    prune(keyToRemove: string): void;
    removeLabel(labelToRemove: IndexedLabel): void;
}
export declare class Labeler {
    index: Index;
    z: number;
    scratch: any;
    labelRules: LabelRule[];
    callback?: TileInvalidationCallback;
    maxLabeledTiles: number;
    constructor(z: number, scratch: any, labelRules: LabelRule[], maxLabeledTiles: number, callback?: TileInvalidationCallback);
    private layout;
    private findInvalidatedTiles;
    private pruneCache;
    add(prepared_tile: PreparedTile): number;
}
export declare class Labelers {
    labelers: Map<number, Labeler>;
    scratch: any;
    labelRules: LabelRule[];
    maxLabeledTiles: number;
    callback: TileInvalidationCallback;
    constructor(scratch: any, labelRules: LabelRule[], maxLabeledTiles: number, callback: TileInvalidationCallback);
    add(prepared_tile: PreparedTile): number;
    getIndex(z: number): RBush;
}
export {};
