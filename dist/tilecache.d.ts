import Point from "@mapbox/point-geometry";
import { PMTiles } from "pmtiles";
export declare enum GeomType {
    Point = 1,
    Line = 2,
    Polygon = 3
}
export interface Bbox {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
}
export interface Feature {
    readonly props: any;
    readonly bbox: Bbox;
    readonly geomType: GeomType;
    readonly geom: Point[][];
    readonly numVertices: number;
}
export interface Zxy {
    readonly z: number;
    readonly x: number;
    readonly y: number;
}
export declare function toIndex(c: Zxy): string;
export interface TileSource {
    get(c: Zxy, tileSize: number): Promise<Map<string, Feature[]>>;
}
export declare class PmtilesSource implements TileSource {
    p: PMTiles;
    controllers: any[];
    shouldCancelZooms: boolean;
    constructor(url: any, shouldCancelZooms: boolean);
    get(c: Zxy, tileSize: number): Promise<Map<string, Feature[]>>;
}
export declare class ZxySource implements TileSource {
    url: string;
    controllers: any[];
    shouldCancelZooms: boolean;
    constructor(url: string, shouldCancelZooms: boolean);
    get(c: Zxy, tileSize: number): Promise<Map<string, Feature[]>>;
}
export interface CacheEntry {
    used: number;
    data: Map<string, Feature[]>;
}
export declare function isInRing(point: Point, ring: Point[]): boolean;
export declare function isCCW(ring: Point[]): boolean;
export declare function pointInPolygon(point: Point, geom: Point[][]): boolean;
export declare function pointMinDistToPoints(point: Point, geom: Point[][]): number;
export declare function pointMinDistToLines(point: Point, geom: Point[][]): number;
export interface PickedFeature {
    feature: Feature;
    layerName: string;
}
export declare class TileCache {
    source: TileSource;
    cache: Map<string, CacheEntry>;
    inflight: Map<string, any[]>;
    tileSize: number;
    constructor(source: TileSource, tileSize: number);
    queryFeatures(lng: number, lat: number, zoom: number, brushSize: number): PickedFeature[];
    get(c: Zxy): Promise<Map<string, Feature[]>>;
}
