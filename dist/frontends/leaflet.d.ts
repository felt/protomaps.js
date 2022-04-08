export declare type DataSourceOptions = {
    url: string;
    maxDataZoom?: number;
    levelDiff?: number;
};
export declare type DataSource = {
    name: string;
    options: DataSourceOptions;
};
declare const leafletLayer: (options: any) => any;
export { leafletLayer };
