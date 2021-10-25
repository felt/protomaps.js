// @ts-ignore
import Point from "@mapbox/point-geometry";
export type Vector = Point;

export const normalize = (v: Vector): Vector => {
  const vectorMagnitude = Math.hypot(v.x, v.y);
  return { x: v.x / vectorMagnitude, y: v.y / vectorMagnitude };
};
