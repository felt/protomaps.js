import { Rule } from "../painter";
import { LabelRule } from "../labeler";
export declare type DataSourceOptions = {
    url: string;
    maxDataZoom?: number;
    levelDiff?: number;
};
export declare type DataSource = {
    name: string;
    options: DataSourceOptions;
    paintRules: Rule[];
    labelRules: LabelRule[];
};
declare const leafletLayer: (options: any) => any;
export { leafletLayer };
