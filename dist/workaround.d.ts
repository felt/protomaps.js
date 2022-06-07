import Point from "@mapbox/point-geometry";
export declare const simplify: (rings: number[][][], pointsToKeep: number) => number[][][];
export declare const splitMultiLineString: (mls: Point[][], maxVertices: number) => any[][][];
export declare const splitMultiPolygon: (mp: Point[][], maxVertices: number) => any[][][];
