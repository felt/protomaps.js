import Point from "@mapbox/point-geometry";
import { Feature, Bbox } from "./tilecache";
import { NumberAttr, StringAttr, TextAttr, FontAttr, ArrayAttr } from "./attribute";
import { Label, Layout } from "./labeler";
export declare const MAX_VERTICES_PER_DRAW_CALL = 4000;
export interface GroupedGeometries {
    geoms: Point[][][];
    features: Feature[];
}
declare type ClippingFunction = (f: Feature) => boolean;
declare type TransformFunction = (geom: any[][]) => any[][];
declare type FilterFunction = (feature: Feature) => boolean;
export interface PaintSymbolizer {
    before?(ctx: any, z: number): void;
    draw?(ctx: any, geom: Point[][], z: number, feature: Feature): void;
    drawGrouped?(ctx: any, z: number, features: Feature[], inside: ClippingFunction, transformFunction: TransformFunction, filterFunction: FilterFunction): void;
}
export declare const enum Justify {
    Left = 1,
    Center = 2,
    Right = 3
}
export interface DrawExtra {
    justify: Justify;
}
export interface LabelSymbolizer {
    place(layout: Layout, geom: Point[][], feature: Feature): Label[] | undefined;
}
export declare const createPattern: (width: number, height: number, fn: (canvas: any, ctx: any) => void) => HTMLCanvasElement;
export declare class PolygonSymbolizer implements PaintSymbolizer {
    pattern: any;
    fill: StringAttr;
    opacity: NumberAttr;
    stroke: StringAttr;
    width: NumberAttr;
    per_feature: boolean;
    do_stroke: boolean;
    constructor(options: any);
    before(ctx: any, z: number): void;
    draw(ctx: any, geom: Point[][], z: number, f: Feature): void;
}
export declare class GroupedPolygonSymbolizer implements PaintSymbolizer {
    pattern: any;
    fill: StringAttr;
    opacity: NumberAttr;
    stroke: StringAttr;
    width: NumberAttr;
    do_stroke: boolean;
    constructor(options: any);
    before(ctx: any, z: number): void;
    drawGrouped(ctx: any, z: number, features: Feature[], inside: ClippingFunction, transform: TransformFunction, filter: FilterFunction): void;
}
export declare function arr(base: number, a: number[]): (z: number) => number;
export declare function exp(base: number, stops: number[][]): (z: number) => number;
export declare type Stop = [number, number] | [number, string] | [number, boolean];
export declare function step(output0: number | string | boolean, stops: Stop[]): (z: number) => number | string | boolean;
export declare function linear(stops: number[][]): (z: number) => number;
export declare function cubicBezier(x1: number, y1: number, x2: number, y2: number, stops: number[][]): (z: number) => number;
export declare class LineSymbolizer implements PaintSymbolizer {
    color: StringAttr;
    width: NumberAttr;
    opacity: NumberAttr;
    dash: ArrayAttr | null;
    dashColor: StringAttr;
    dashWidth: NumberAttr;
    skip: boolean;
    per_feature: boolean;
    lineCap: StringAttr;
    lineJoin: StringAttr;
    constructor(options: any);
    before(ctx: any, z: number): void;
    draw(ctx: any, geom: Point[][], z: number, f: Feature): void;
}
export declare class GroupedLineSymbolizer implements PaintSymbolizer {
    color: StringAttr;
    width: NumberAttr;
    opacity: NumberAttr;
    dash: ArrayAttr | null;
    dashColor: StringAttr;
    dashWidth: NumberAttr;
    skip: boolean;
    per_feature: boolean;
    lineCap: StringAttr;
    lineJoin: StringAttr;
    constructor(options: any);
    before(ctx: any, z: number): void;
    drawGrouped(ctx: any, z: number, features: Feature[], inside: ClippingFunction, transform: TransformFunction, filter: FilterFunction): void;
}
export declare class IconSymbolizer implements LabelSymbolizer {
    sprites: any;
    name: string;
    constructor(options: any);
    place(layout: Layout, geom: Point[][], feature: Feature): {
        anchor: any;
        bboxes: {
            minX: number;
            minY: number;
            maxX: any;
            maxY: any;
        }[];
        draw: (ctx: any) => void;
    }[];
}
export declare class CircleSymbolizer implements LabelSymbolizer, PaintSymbolizer {
    radius: NumberAttr;
    fill: StringAttr;
    stroke: StringAttr;
    width: NumberAttr;
    opacity: NumberAttr;
    constructor(options: any);
    draw(ctx: any, geom: Point[][], z: number, f: Feature): void;
    place(layout: Layout, geom: Point[][], feature: Feature): {
        anchor: any;
        bboxes: {
            minX: number;
            minY: number;
            maxX: any;
            maxY: any;
        }[];
        draw: (ctx: any) => void;
    }[];
}
export declare class ShieldSymbolizer implements LabelSymbolizer {
    font: FontAttr;
    text: TextAttr;
    background: StringAttr;
    fill: StringAttr;
    padding: NumberAttr;
    constructor(options: any);
    place(layout: Layout, geom: Point[][], f: Feature): {
        anchor: any;
        bboxes: {
            minX: number;
            minY: number;
            maxX: any;
            maxY: any;
        }[];
        draw: (ctx: any) => void;
    }[] | undefined;
}
export declare class FlexSymbolizer implements LabelSymbolizer {
    list: LabelSymbolizer[];
    constructor(list: LabelSymbolizer[], options: any);
    place(layout: Layout, geom: Point[][], feature: Feature): {
        anchor: any;
        bboxes: Bbox[];
        draw: (ctx: any) => void;
    }[] | undefined;
}
export declare class GroupSymbolizer implements LabelSymbolizer {
    list: LabelSymbolizer[];
    constructor(list: LabelSymbolizer[]);
    place(layout: Layout, geom: Point[][], feature: Feature): {
        anchor: any;
        bboxes: Bbox[];
        draw: (ctx: any) => void;
    }[] | undefined;
}
export declare class CenteredSymbolizer implements LabelSymbolizer {
    symbolizer: LabelSymbolizer;
    constructor(symbolizer: LabelSymbolizer);
    place(layout: Layout, geom: Point[][], feature: Feature): {
        anchor: any;
        bboxes: {
            minX: number;
            maxX: any;
            minY: number;
            maxY: any;
        }[];
        draw: (ctx: any) => void;
    }[] | undefined;
}
export declare class Padding implements LabelSymbolizer {
    symbolizer: LabelSymbolizer;
    padding: NumberAttr;
    constructor(padding: number, symbolizer: LabelSymbolizer);
    place(layout: Layout, geom: Point[][], feature: Feature): Label[] | undefined;
}
export declare class TextSymbolizer implements LabelSymbolizer {
    font: FontAttr;
    text: TextAttr;
    fill: StringAttr;
    stroke: StringAttr;
    width: NumberAttr;
    lineHeight: NumberAttr;
    letterSpacing: NumberAttr;
    maxLineCodeUnits: NumberAttr;
    justify: Justify;
    constructor(options: any);
    place(layout: Layout, geom: Point[][], feature: Feature): {
        anchor: any;
        bboxes: {
            minX: any;
            minY: number;
            maxX: any;
            maxY: any;
        }[];
        draw: (ctx: any, extra?: DrawExtra | undefined) => void;
    }[] | undefined;
}
export declare class CenteredTextSymbolizer implements LabelSymbolizer {
    centered: LabelSymbolizer;
    constructor(options: any);
    place(layout: Layout, geom: Point[][], feature: Feature): Label[] | undefined;
}
export declare class OffsetSymbolizer implements LabelSymbolizer {
    offset: NumberAttr;
    symbolizer: LabelSymbolizer;
    constructor(symbolizer: LabelSymbolizer, options: any);
    place(layout: Layout, geom: Point[][], feature: Feature): {
        anchor: any;
        bboxes: {
            minX: any;
            minY: any;
            maxX: any;
            maxY: any;
        }[];
        draw: (ctx: any) => void;
    }[] | undefined;
}
export declare class OffsetTextSymbolizer implements LabelSymbolizer {
    symbolizer: LabelSymbolizer;
    constructor(options: any);
    place(layout: Layout, geom: Point[][], feature: Feature): Label[] | undefined;
}
export declare const enum LineLabelPlacement {
    Above = 1,
    Center = 2,
    Below = 3
}
export declare class LineLabelSymbolizer implements LabelSymbolizer {
    font: FontAttr;
    text: TextAttr;
    fill: StringAttr;
    stroke: StringAttr;
    width: NumberAttr;
    offset: NumberAttr;
    position: LineLabelPlacement;
    maxLabelCodeUnits: NumberAttr;
    repeatDistance: NumberAttr;
    constructor(options: any);
    place(layout: Layout, geom: Point[][], feature: Feature): {
        anchor: any;
        bboxes: {
            minX: number;
            minY: number;
            maxX: any;
            maxY: any;
        }[];
        draw: (ctx: any) => void;
        deduplicationKey: string;
        deduplicationDistance: number;
    }[] | undefined;
}
export declare class PolygonLabelSymbolizer implements LabelSymbolizer {
    symbolizer: LabelSymbolizer;
    constructor(options: any);
    place(layout: Layout, geom: Point[][], feature: Feature): {
        anchor: any;
        bboxes: {
            minX: number;
            minY: number;
            maxX: any;
            maxY: any;
        }[];
        draw: (ctx: any) => void;
    }[] | undefined;
}
export {};
