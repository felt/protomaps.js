import { PolygonSymbolizer, LineSymbolizer, LineLabelSymbolizer, CenteredTextSymbolizer, CircleSymbolizer } from "./../symbolizer";
import { Filter } from "../painter";
import { Feature } from "../tilecache";
export declare function filterFn(arr: any[]): Filter;
export declare function numberFn(obj: any): (z: number, f: Feature) => number;
export declare function numberOrFn(obj: any, defaultValue?: number): number | ((z: number, f: Feature) => number);
export declare function widthFn(width_obj: any, gap_obj: any): (z: number, f: Feature) => number;
interface FontSub {
    face: string;
    weight?: number;
    style?: string;
}
export declare function getFont(obj: any, fontsubmap: any): string | ((z: number, feature: Feature) => string);
export declare function json_style(obj: any, fontsubmap: Map<string, FontSub>): {
    paint_rules: ({
        dataLayer: any;
        filter: Filter | undefined;
        symbolizer: PolygonSymbolizer;
    } | {
        dataLayer: any;
        filter: Filter | undefined;
        symbolizer: LineSymbolizer;
    } | {
        dataLayer: any;
        filter: Filter | undefined;
        symbolizer: CircleSymbolizer;
    })[];
    label_rules: ({
        dataLayer: any;
        filter: Filter | undefined;
        symbolizer: LineLabelSymbolizer;
    } | {
        dataLayer: any;
        filter: Filter | undefined;
        symbolizer: CenteredTextSymbolizer;
    })[];
    tasks: never[];
};
export {};
