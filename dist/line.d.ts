import Point from "@mapbox/point-geometry";
export interface LabelableSegment {
    length: number;
    beginIndex: number;
    beginDistance: number;
    endIndex: number;
    endDistance: number;
}
export interface LabelCandidate {
    start: Point;
    end: Point;
}
export declare function simpleLabel(mls: any, minimum: number, repeatDistance: number, cellSize: number): LabelCandidate[];
export declare function lineCells(a: Point, b: Point, length: number, spacing: number): {
    x: any;
    y: any;
}[];
