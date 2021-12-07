// @ts-ignore
import Point from "@mapbox/point-geometry";
import { transformGeom } from "./view";
const isFeatureInTile = (f, scaleFactor, origin, tileBbox) => {
    const fbox = f.bbox;
    return !(fbox.maxX * scaleFactor + origin.x < tileBbox.minX ||
        fbox.minX * scaleFactor + origin.x > tileBbox.maxX ||
        fbox.minY * scaleFactor + origin.y > tileBbox.maxY ||
        fbox.maxY * scaleFactor + origin.y < tileBbox.minY);
};
export function painter(ctx, z, prepared_tilemaps, label_data, rules, bbox, origin, clip, debug) {
    let start = performance.now();
    ctx.save();
    ctx.miterLimit = 2;
    for (var prepared_tilemap of prepared_tilemaps) {
        // find the smallest of all the origins
        // if (clip) {
        //   ctx.beginPath();
        //   let minX = Math.max(po.x - origin.x, bbox.minX - origin.x) - 0.5;
        //   let minY = Math.max(po.y - origin.y, bbox.minY - origin.y) - 0.5;
        //   let maxX = Math.min(po.x - origin.x + dim, bbox.maxX - origin.x) + 0.5;
        //   let maxY = Math.min(po.y - origin.y + dim, bbox.maxY - origin.y) + 0.5;
        //   ctx.rect(minX, minY, maxX - minX, maxY - minY);
        //   ctx.clip();
        // }
        // if (clip) {
        //   // small fudge factor in static mode to fix seams
        //   ctx.translate(dim / 2, dim / 2);
        //   ctx.scale(1 + 1 / dim, 1 + 1 / dim);
        //   ctx.translate(-dim / 2, -dim / 2);
        // }
        for (var rule of rules) {
            if (rule.minzoom && z < rule.minzoom)
                continue;
            if (rule.maxzoom && z > rule.maxzoom)
                continue;
            let prepared_tile = prepared_tilemap.get(rule.dataSource || "");
            if (!prepared_tile)
                continue;
            var layer = prepared_tile.data.get(rule.dataLayer);
            if (layer === undefined)
                continue;
            if (rule.symbolizer.before)
                rule.symbolizer.before(ctx, prepared_tile.z);
            ctx.save();
            let po = prepared_tile.origin;
            let dim = prepared_tile.dim;
            let ps = prepared_tile.scale;
            ctx.translate(po.x - origin.x, po.y - origin.y);
            if (rule.symbolizer.drawGrouped) {
                rule.symbolizer.drawGrouped(ctx, prepared_tile.z, layer, (f) => isFeatureInTile(f, ps, po, bbox), ps != 1 ? (g) => transformGeom(g, ps, new Point(0, 0)) : (g) => g, (f) => rule.filter
                    ? rule.filter(prepared_tile.z, f)
                    : true);
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
            ctx.restore();
        }
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
