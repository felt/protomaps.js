// @ts-nocheck
// @ts-ignore
import Point from "@mapbox/point-geometry";
import { isCCW } from "./tilecache";

interface PointWithArea {
  x: number;
  y: number;
}

interface Triangle {
  p0: Point;
  p1: Point;
  p2: Point;
  area: number;
}

const compare = (a: number[][], b: number[][]) => {
  return a[1].area - b[1].area;
};

function minHeap() {
  var heap = {},
    array = [];

  heap.push = function () {
    for (var i = 0, n = arguments.length; i < n; ++i) {
      var object = arguments[i];
      up((object.index = array.push(object) - 1));
    }
    return array.length;
  };

  heap.pop = function () {
    var removed = array[0],
      object = array.pop();
    if (array.length) {
      array[(object.index = 0)] = object;
      down(0);
    }
    return removed;
  };

  heap.remove = function (removed) {
    var i = removed.index,
      object = array.pop();
    if (i !== array.length) {
      array[(object.index = i)] = object;
      (compare(object, removed) < 0 ? up : down)(i);
    }
    return i;
  };

  function up(i) {
    var object = array[i];
    while (i > 0) {
      var up = ((i + 1) >> 1) - 1,
        parent = array[up];
      if (compare(object, parent) >= 0) break;
      array[(parent.index = i)] = parent;
      array[(object.index = i = up)] = object;
    }
  }

  function down(i) {
    var object = array[i];
    while (true) {
      var right = (i + 1) * 2,
        left = right - 1,
        down = i,
        child = array[down];
      if (left < array.length && compare(array[left], child) < 0)
        child = array[(down = left)];
      if (right < array.length && compare(array[right], child) < 0)
        child = array[(down = right)];
      if (down === i) break;
      array[(child.index = i)] = child;
      array[(object.index = i = down)] = object;
    }
  }
  return heap;
}

const area = (t: number[][]) => {
  return Math.abs(
    (t[0].x - t[2].x) * (t[1].y - t[0].y) -
      (t[0].x - t[1].x) * (t[2].y - t[0].y)
  );
};

export const simplify = (rings: number[][][], pointsToKeep: number) => {
  let globalWeights = [];

  for (let ring of rings) {
    let weights = simplifyRing(ring, pointsToKeep);
    globalWeights = globalWeights.concat(weights);
  }

  if (pointsToKeep >= globalWeights.length) {
    return rings;
  }

  globalWeights.sort(function (a, b) {
    return b - a;
  });

  let result = [];
  let threshold = globalWeights[pointsToKeep];

  let cnt = 0;
  for (let ring of rings) {
    let resultRing = ring.filter(function (d) {
      return d.area > threshold;
    });

    if (resultRing.length >= 3) {
      result.push(resultRing);
      cnt += resultRing.length;
    }
  }

  return result;
};

const simplifyRing = (ring: number[][], pointsToKeep: number) => {
  var maxArea = 0;

  let heap = minHeap();
  var triangle;
  let triangles = [];
  for (var i = 1, n = ring.length - 1; i < n; ++i) {
    triangle = ring.slice(i - 1, i + 2);
    if ((triangle[1].area = area(triangle))) {
      triangles.push(triangle);
      heap.push(triangle);
    }
  }

  for (var i = 0, n = triangles.length; i < n; ++i) {
    triangle = triangles[i];
    triangle.previous = triangles[i - 1];
    triangle.next = triangles[i + 1];
  }

  while ((triangle = heap.pop())) {
    // If the area of the current point is less than that of the previous point
    // to be eliminated, use the latters area instead. This ensures that the
    // current point cannot be eliminated without eliminating previously-
    // eliminated points.
    if (triangle[1].area < maxArea) triangle[1].area = maxArea;
    else maxArea = triangle[1].area;

    if (triangle.previous) {
      triangle.previous.next = triangle.next;
      triangle.previous[2] = triangle[2];
      update(triangle.previous);
    } else {
      triangle[0].area = triangle[1].area;
    }

    if (triangle.next) {
      triangle.next.previous = triangle.previous;
      triangle.next[0] = triangle[0];
      update(triangle.next);
    } else {
      triangle[2].area = triangle[1].area;
    }
  }

  function update(triangle) {
    heap.remove(triangle);
    triangle[1].area = area(triangle);
    heap.push(triangle);
  }

  var weights = ring.map(function (d) {
    return d.area > 0 ? d.area : Infinity; /*+= Math.random(); /* break ties */
  });

  return weights;
};

export const splitMultiLineString = (mls: Point[][], maxVertices: number) => {
  let retval = [];
  var current = [];
  let currentVertices = 0;
  for (let ls of mls) {
    var temp = ls;
    if (ls.length > maxVertices) {
      console.log("LineString with length: ", ls.length);
      temp = simplify([ls], maxVertices);
    }
    if (current.length > 0 && currentVertices + temp.length > maxVertices) {
      retval.push(current);
      current = [];
      currentVertices = 0;
    }
    current.push(temp);
    currentVertices += ls.length;
  }
  if (current.length > 0) retval.push(current);
  return retval;
};

const verticesCount = (rings: Point[][]): number => {
  var acc = 0;
  for (let ring of rings) {
    acc += ring.length;
  }
  return acc;
};

export const splitMultiPolygon = (mp: Point[][], maxVertices: number) => {
  // group the MultiPolygon into individual polygons based on winding order
  let complete_polygons = [];
  let current_polygon = [];
  for (let poly of mp) {
    if (current_polygon.length > 0 && !isCCW(poly)) {
      complete_polygons.push(current_polygon);
      current_polygon = [];
    }
    current_polygon.push(poly);
  }

  if (current_polygon.length > 0) complete_polygons.push(current_polygon);

  let retval = [];
  var current: Point[][] = [];
  var currentVertices = 0;
  for (let complete_polygon of complete_polygons) {
    var temp = complete_polygon;
    var vc = verticesCount(complete_polygon);
    if (vc > maxVertices) {
      temp = simplify(complete_polygon, maxVertices);
      vc = maxVertices;
    }
    if (current.length > 0 && currentVertices + vc > maxVertices) {
      retval.push(current);
      current = [];
      currentVertices = 0;
    }
    current = current.concat(temp);
    currentVertices += vc;
  }
  if (current.length > 0) retval.push(current);

  return retval;
};
