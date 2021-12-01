import Point from "@mapbox/point-geometry";
import { Bbox, Feature } from "./tilecache";
import { PreparedTile } from "./view";
import { PaintSymbolizer } from "./symbolizer";
import { Index } from "./labeler";
export declare type Filter = (zoom: number, feature: Feature) => boolean;
export interface Rule {
    id?: string;
    minzoom?: number;
    maxzoom?: number;
    dataLayer: string;
    symbolizer: PaintSymbolizer;
    filter?: Filter;
}
export declare function xray(ctx: any, prepared_tiles: PreparedTile[], bbox: Bbox, origin: Point, clip: boolean, debug: string): number;
export declare function painter(ctx: any, prepared_tiles: PreparedTile[], label_data: Index, rules: Rule[], bbox: Bbox, origin: Point, clip: boolean, debug: string): number;
