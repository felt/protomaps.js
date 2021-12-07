import Point from "@mapbox/point-geometry";
import { View } from "../view";
import { Rule } from "../painter";
import { LabelRule } from "../labeler";
export declare const getZoom: (degrees_lng: number, css_pixels: number) => number;
export declare class Static {
    paint_rules: Rule[];
    label_rules: LabelRule[];
    view: View;
    debug: string;
    scratch: any;
    backgroundColor: string;
    constructor(options: any);
    drawContext(ctx: any, width: number, height: number, latlng: number[], display_zoom: number): Promise<{
        elapsed: number;
        project: (latlng: number[]) => any;
        unproject: (point: any) => {
            lat: number;
            lng: number;
        };
    }>;
    drawCanvas(canvas: any, latlng: Point, display_zoom: number, options?: any): Promise<{
        elapsed: number;
        project: (latlng: number[]) => any;
        unproject: (point: any) => {
            lat: number;
            lng: number;
        };
    }>;
    drawContextBounds(ctx: any, top_left: Point, bottom_right: Point, width: number, height: number): Promise<{
        elapsed: number;
        project: (latlng: number[]) => any;
        unproject: (point: any) => {
            lat: number;
            lng: number;
        };
    }>;
    drawCanvasBounds(canvas: any, top_left: Point, bottom_right: Point, width: number, options?: any): Promise<{
        elapsed: number;
        project: (latlng: number[]) => any;
        unproject: (point: any) => {
            lat: number;
            lng: number;
        };
    }>;
}
