// @ts-ignore
import Point from "@mapbox/point-geometry";
import { transformGeom } from "./view";
// xray
import { GeomType } from "./tilecache";
import { CircleSymbolizer, LineSymbolizer, PolygonSymbolizer, } from "./symbolizer";
export function xray(ctx, prepared_tiles, bbox, origin, clip, debug) {
    let start = performance.now();
    let xray_colors = [
        "crimson",
        "lightgreen",
        "lightseagreen",
        "mediumslateblue",
        "purple",
        "cornflowerblue",
    ];
    ctx.save();
    ctx.miterLimit = 2;
    for (var prepared_tile of prepared_tiles) {
        let po = prepared_tile.origin;
        let ps = prepared_tile.scale;
        let dim = prepared_tile.dim;
        ctx.save();
        if (clip) {
            ctx.beginPath();
            let minX = Math.max(po.x - origin.x, bbox.minX - origin.x) - 0.5;
            let minY = Math.max(po.y - origin.y, bbox.minY - origin.y) - 0.5;
            let maxX = Math.min(po.x - origin.x + dim, bbox.maxX - origin.x) + 0.5;
            let maxY = Math.min(po.y - origin.y + dim, bbox.maxY - origin.y) + 0.5;
            ctx.rect(minX, minY, maxX - minX, maxY - minY);
            ctx.clip();
        }
        ctx.translate(po.x - origin.x, po.y - origin.y);
        if (clip) {
            // small fudge factor in static mode to fix seams
            ctx.translate(dim / 2, dim / 2);
            ctx.scale(1 + 1 / dim, 1 + 1 / dim);
            ctx.translate(-dim / 2, -dim / 2);
        }
        prepared_tile.data.forEach((features, layerName) => {
            if (layerName == "earth")
                return;
            let color = xray_colors[layerName.charCodeAt(0) % 6];
            // determine a color from k
            let point_symbolizer = new CircleSymbolizer({
                fill: color,
                opacity: 0.8,
            });
            let line_symbolizer = new LineSymbolizer({
                per_feature: true,
                color: color,
                opacity: 0.5,
            });
            let polygon_symbolizer = new PolygonSymbolizer({
                per_feature: true,
                fill: color,
                opacity: 0.3,
            });
            line_symbolizer.before(ctx, prepared_tile.z);
            polygon_symbolizer.before(ctx, prepared_tile.z);
            for (var feature of features) {
                let geom = feature.geom;
                let fbox = feature.bbox;
                if (fbox.maxX * ps + po.x < bbox.minX ||
                    fbox.minX * ps + po.x > bbox.maxX ||
                    fbox.minY * ps + po.y > bbox.maxY ||
                    fbox.maxY * ps + po.y < bbox.minY) {
                    continue;
                }
                if (ps != 1) {
                    geom = transformGeom(geom, ps, new Point(0, 0));
                }
                if (feature.geomType == GeomType.Point) {
                    point_symbolizer.draw(ctx, geom, prepared_tile.z, feature);
                }
                else if (feature.geomType == GeomType.Line) {
                    line_symbolizer.draw(ctx, geom, prepared_tile.z, feature);
                }
                else {
                    polygon_symbolizer.draw(ctx, geom, prepared_tile.z, feature);
                    line_symbolizer.draw(ctx, geom, prepared_tile.z, feature);
                }
            }
        });
        ctx.restore();
    }
    if (clip) {
        ctx.beginPath();
        ctx.rect(bbox.minX - origin.x, bbox.minY - origin.y, bbox.maxX - bbox.minX, bbox.maxY - bbox.minY);
        ctx.clip();
    }
    ctx.restore();
    return performance.now() - start;
}
const isFeatureInTile = (f, scaleFactor, origin, tileBbox) => {
    const fbox = f.bbox;
    return !(fbox.maxX * scaleFactor + origin.x < tileBbox.minX ||
        fbox.minX * scaleFactor + origin.x > tileBbox.maxX ||
        fbox.minY * scaleFactor + origin.y > tileBbox.maxY ||
        fbox.maxY * scaleFactor + origin.y < tileBbox.minY);
};
export function painter(ctx, prepared_tiles, label_data, rules, bbox, origin, clip, debug) {
    let start = performance.now();
    ctx.save();
    ctx.miterLimit = 2;
    for (var prepared_tile of prepared_tiles) {
        let po = prepared_tile.origin;
        let ps = prepared_tile.scale;
        let dim = prepared_tile.dim;
        ctx.save();
        if (clip) {
            ctx.beginPath();
            let minX = Math.max(po.x - origin.x, bbox.minX - origin.x) - 0.5;
            let minY = Math.max(po.y - origin.y, bbox.minY - origin.y) - 0.5;
            let maxX = Math.min(po.x - origin.x + dim, bbox.maxX - origin.x) + 0.5;
            let maxY = Math.min(po.y - origin.y + dim, bbox.maxY - origin.y) + 0.5;
            ctx.rect(minX, minY, maxX - minX, maxY - minY);
            ctx.clip();
        }
        ctx.translate(po.x - origin.x, po.y - origin.y);
        if (clip) {
            // small fudge factor in static mode to fix seams
            ctx.translate(dim / 2, dim / 2);
            ctx.scale(1 + 1 / dim, 1 + 1 / dim);
            ctx.translate(-dim / 2, -dim / 2);
        }
        for (var rule of rules) {
            if (rule.minzoom && prepared_tile.z < rule.minzoom)
                continue;
            if (rule.maxzoom && prepared_tile.z > rule.maxzoom)
                continue;
            var layer = prepared_tile.data.get(rule.dataLayer);
            if (layer === undefined)
                continue;
            if (rule.symbolizer.before)
                rule.symbolizer.before(ctx, prepared_tile.z);
            if (rule.symbolizer.drawGrouped) {
                rule.symbolizer.drawGrouped(ctx, prepared_tile.z, layer, (f) => isFeatureInTile(f, ps, po, bbox), ps != 1 ? (g) => transformGeom(g, ps, new Point(0, 0)) : (g) => g, (f) => (rule.filter ? rule.filter(prepared_tile.z, f) : true));
            }
            else if (rule.symbolizer.draw) {
                for (var feature of layer) {
                    let geom = feature.geom;
                    if (!isFeatureInTile(feature, ps, po, bbox)) {
                        continue;
                    }
                    if (rule.filter && !rule.filter(prepared_tile.z, feature))
                        continue;
                    if (ps != 1) {
                        geom = transformGeom(geom, ps, new Point(0, 0));
                    }
                    rule.symbolizer.draw(ctx, geom, prepared_tile.z, feature);
                }
            }
        }
        ctx.restore();
    }
    if (clip) {
        ctx.beginPath();
        ctx.rect(bbox.minX - origin.x, bbox.minY - origin.y, bbox.maxX - bbox.minX, bbox.maxY - bbox.minY);
        ctx.clip();
    }
    if (label_data) {
        let matches = label_data.searchBbox(bbox, Infinity);
        for (var label of matches) {
            ctx.save();
            ctx.translate(label.anchor.x - origin.x, label.anchor.y - origin.y);
            label.draw(ctx);
            ctx.restore();
            if (debug) {
                ctx.lineWidth = 0.5;
                ctx.strokeStyle = debug;
                ctx.fillStyle = debug;
                ctx.globalAlpha = 1;
                ctx.fillRect(label.anchor.x - origin.x - 2, label.anchor.y - origin.y - 2, 4, 4);
                for (let bbox of label.bboxes) {
                    ctx.strokeRect(bbox.minX - origin.x, bbox.minY - origin.y, bbox.maxX - bbox.minX, bbox.maxY - bbox.minY);
                }
            }
        }
    }
    ctx.restore();
    return performance.now() - start;
}
