import Point from "@mapbox/point-geometry";
import { Feature } from "./tilecache";
import { Justify, LabelSymbolizer, TextSymbolizer } from "./symbolizer";
import { Label, Layout } from "./labeler";
export declare enum TextPlacements {
    N = 1,
    NE = 2,
    E = 3,
    SE = 4,
    S = 5,
    SW = 6,
    W = 7,
    NW = 8
}
export interface OffsetSymbolizerValues {
    offsetX?: number;
    offsetY?: number;
    placements?: TextPlacements[];
    justify?: Justify;
}
declare type DataDrivenFunction = (zoom: number, feature: Feature) => OffsetSymbolizerValues;
export declare class DataDrivenOffsetSymbolizer implements LabelSymbolizer {
    symbolizer: TextSymbolizer;
    offsetX: number;
    offsetY: number;
    placements: TextPlacements[];
    attrs: DataDrivenFunction;
    constructor(symbolizer: TextSymbolizer, options: any);
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
    private getBbox;
    private placeLabelInPoint;
    private getDrawFunction;
    private computeXAxisOffset;
    private computeYAxisOffset;
    private computeJustify;
}
export declare class DataDrivenOffsetTextSymbolizer implements LabelSymbolizer {
    symbolizer: LabelSymbolizer;
    constructor(options: any);
    place(layout: Layout, geom: Point[][], feature: Feature): Label[] | undefined;
}
export {};
