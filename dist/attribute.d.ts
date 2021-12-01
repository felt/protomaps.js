import { Feature } from "./tilecache";
export declare class StringAttr {
    str: string | ((z: number, f?: Feature) => string);
    per_feature: boolean;
    constructor(c: any, defaultValue?: string);
    get(z: number, f?: Feature): string;
}
export declare class NumberAttr {
    value: number | ((z: number, f?: Feature) => number);
    per_feature: boolean;
    constructor(c: any, defaultValue?: number);
    get(z: number, f?: Feature): number;
}
export declare class TextAttr {
    label_props: string[] | ((z: number, f?: Feature) => string[]);
    textTransform: string | ((z: number, f?: Feature) => string);
    constructor(options?: any);
    get(z: number, f: Feature): string;
}
export declare class FontAttr {
    family?: string | ((z: number, f: Feature) => string);
    size?: number | ((z: number, f: Feature) => number);
    weight?: number | ((z: number, f: Feature) => number);
    style?: number | ((z: number, f: Feature) => string);
    font?: string | ((z: number, f: Feature) => string);
    constructor(options: any);
    get(z: number, f: Feature): string;
}
export declare class ArrayAttr {
    value: string[] | number[] | ((z: number, f?: Feature) => string[] | number[]);
    per_feature: boolean;
    constructor(c: any, defaultValue?: number[]);
    get(z: number, f?: Feature): string[] | number[];
}
