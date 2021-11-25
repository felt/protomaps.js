// @ts-ignore
import Point from "@mapbox/point-geometry";
import { transformGeom } from "./view";
import { toIndex } from "./tilecache";
// @ts-ignore
import RBush from "rbush";
export const covering = (display_zoom, tile_width, bbox) => {
    let res = 256;
    let f = tile_width / res;
    let minx = Math.floor(bbox.minX / res);
    let miny = Math.floor(bbox.minY / res);
    let maxx = Math.floor(bbox.maxX / res);
    let maxy = Math.floor(bbox.maxY / res);
    let leveldiff = Math.log2(f);
    let retval = [];
    for (let x = minx; x <= maxx; x++) {
        let wrapped_x = x % (1 << display_zoom);
        for (let y = miny; y <= maxy; y++) {
            retval.push({
                display: toIndex({ z: display_zoom, x: wrapped_x, y: y }),
                key: toIndex({
                    z: display_zoom - leveldiff,
                    x: Math.floor(wrapped_x / f),
                    y: Math.floor(y / f),
                }),
            });
        }
    }
    return retval;
};
export class Index {
    constructor(dim) {
        this.tree = new RBush();
        this.current = new Map();
        this.dim = dim;
    }
    has(tileKey) {
        return this.current.has(tileKey);
    }
    size() {
        return this.current.size;
    }
    keys() {
        return this.current.keys();
    }
    searchBbox(bbox, order) {
        let labels = new Set();
        for (let match of this.tree.search(bbox)) {
            if (match.indexed_label.order <= order) {
                labels.add(match.indexed_label);
            }
        }
        return labels;
    }
    searchLabel(label, order) {
        let labels = new Set();
        for (let bbox of label.bboxes) {
            for (let match of this.tree.search(bbox)) {
                if (match.indexed_label.order <= order) {
                    labels.add(match.indexed_label);
                }
            }
        }
        return labels;
    }
    bboxCollides(bbox, order) {
        for (let match of this.tree.search(bbox)) {
            if (match.indexed_label.order <= order)
                return true;
        }
        return false;
    }
    labelCollides(label, order) {
        for (let bbox of label.bboxes) {
            for (let match of this.tree.search(bbox)) {
                if (match.indexed_label.order <= order)
                    return true;
            }
        }
        return false;
    }
    deduplicationCollides(label) {
        // create a bbox around anchor to find potential matches.
        // this is depending on precondition: (anchor is contained within, or on boundary of, a label bbox)
        if (!label.deduplicationKey || !label.deduplicationDistance)
            return false;
        let dist = label.deduplicationDistance;
        let test_bbox = {
            minX: label.anchor.x - dist,
            minY: label.anchor.y - dist,
            maxX: label.anchor.x + dist,
            maxY: label.anchor.y + dist,
        };
        for (let collision of this.tree.search(test_bbox)) {
            if (collision.indexed_label.deduplicationKey === label.deduplicationKey) {
                if (collision.indexed_label.anchor.dist(label.anchor) < dist) {
                    return true;
                }
            }
        }
        return false;
    }
    // can put in multiple due to antimeridian wrapping
    insert(label, order, tileKey) {
        let indexed_label = {
            anchor: label.anchor,
            bboxes: label.bboxes,
            draw: label.draw,
            order: order,
            tileKey: tileKey,
            deduplicationKey: label.deduplicationKey,
            deduplicationDistance: label.deduplicationDistance,
        };
        let entry = this.current.get(tileKey);
        if (entry) {
            entry.add(indexed_label);
        }
        else {
            let newSet = new Set();
            newSet.add(indexed_label);
            this.current.set(tileKey, newSet);
        }
        var wrapsLeft = false;
        var wrapsRight = false;
        for (let bbox of label.bboxes) {
            var b = bbox;
            b.indexed_label = indexed_label;
            this.tree.insert(b);
            if (bbox.minX < 0)
                wrapsLeft = true;
            if (bbox.maxX > this.dim)
                wrapsRight = true;
        }
        if (wrapsLeft || wrapsRight) {
            var shift = wrapsLeft ? this.dim : -this.dim;
            var new_bboxes = [];
            for (let bbox of label.bboxes) {
                new_bboxes.push({
                    minX: bbox.minX + shift,
                    minY: bbox.minY,
                    maxX: bbox.maxX + shift,
                    maxY: bbox.maxY,
                });
            }
            let duplicate_label = {
                anchor: new Point(label.anchor.x + shift, label.anchor.y),
                bboxes: new_bboxes,
                draw: label.draw,
                order: order,
                tileKey: tileKey,
            };
            let entry = this.current.get(tileKey);
            if (entry)
                entry.add(duplicate_label);
            for (let bbox of new_bboxes) {
                var b = bbox;
                b.indexed_label = duplicate_label;
                this.tree.insert(b);
            }
        }
    }
    prune(keyToRemove) {
        let indexed_labels = this.current.get(keyToRemove);
        if (!indexed_labels)
            return; // TODO: not that clean...
        let entries_to_delete = [];
        for (let entry of this.tree.all()) {
            if (indexed_labels.has(entry.indexed_label)) {
                entries_to_delete.push(entry);
            }
        }
        entries_to_delete.forEach((entry) => {
            this.tree.remove(entry);
        });
        this.current.delete(keyToRemove);
    }
    // NOTE: technically this is incorrect
    // with antimeridian wrapping, since we should also remove
    // the duplicate label; but i am having a hard time
    // imagining where this will happen in practical usage
    removeLabel(labelToRemove) {
        let entries_to_delete = [];
        for (let entry of this.tree.all()) {
            if (labelToRemove == entry.indexed_label) {
                entries_to_delete.push(entry);
            }
        }
        entries_to_delete.forEach((entry) => {
            this.tree.remove(entry);
        });
        let c = this.current.get(labelToRemove.tileKey);
        if (c)
            c.delete(labelToRemove);
    }
}
export class Labeler {
    constructor(z, scratch, labelRules, maxLabeledTiles, callback) {
        this.index = new Index((256 * 1) << z);
        this.z = z;
        this.scratch = scratch;
        this.labelRules = labelRules;
        this.callback = callback;
        this.maxLabeledTiles = maxLabeledTiles;
    }
    layout(pt) {
        let start = performance.now();
        let key = toIndex(pt.data_tile);
        let tiles_invalidated = new Set();
        for (let [order, rule] of this.labelRules.entries()) {
            if (rule.visible == false)
                continue;
            if (rule.minzoom && this.z < rule.minzoom)
                continue;
            if (rule.maxzoom && this.z > rule.maxzoom)
                continue;
            let layer = pt.data.get(rule.dataLayer);
            if (layer === undefined)
                continue;
            let feats = layer;
            if (rule.sort)
                feats.sort((a, b) => {
                    if (rule.sort) {
                        // TODO ugly hack for type checking
                        return rule.sort(a.props, b.props);
                    }
                    return 0;
                });
            let layout = {
                index: this.index,
                zoom: this.z,
                scratch: this.scratch,
                order: order,
                overzoom: this.z - pt.data_tile.z,
            };
            for (let feature of feats) {
                if (rule.filter && !rule.filter(this.z, feature))
                    continue;
                let transformed = transformGeom(feature.geom, pt.scale, pt.origin);
                let labels = rule.symbolizer.place(layout, transformed, feature);
                if (!labels)
                    continue;
                for (let label of labels) {
                    var label_added = false;
                    if (label.deduplicationKey &&
                        this.index.deduplicationCollides(label)) {
                        continue;
                    }
                    // does the label collide with anything?
                    if (this.index.labelCollides(label, Infinity)) {
                        if (!this.index.labelCollides(label, order)) {
                            let conflicts = this.index.searchLabel(label, Infinity);
                            for (let conflict of conflicts) {
                                this.index.removeLabel(conflict);
                                for (let bbox of conflict.bboxes) {
                                    this.findInvalidatedTiles(tiles_invalidated, pt.dim, bbox, key);
                                }
                            }
                            this.index.insert(label, order, key);
                            label_added = true;
                        }
                        // label not added.
                    }
                    else {
                        this.index.insert(label, order, key);
                        label_added = true;
                    }
                    if (label_added) {
                        for (let bbox of label.bboxes) {
                            if (bbox.maxX > pt.origin.x + pt.dim ||
                                bbox.minX < pt.origin.x ||
                                bbox.minY < pt.origin.y ||
                                bbox.maxY > pt.origin.y + pt.dim) {
                                this.findInvalidatedTiles(tiles_invalidated, pt.dim, bbox, key);
                            }
                        }
                    }
                }
            }
        }
        if (tiles_invalidated.size > 0 && this.callback) {
            this.callback(tiles_invalidated);
        }
        return performance.now() - start;
    }
    findInvalidatedTiles(tiles_invalidated, dim, bbox, key) {
        let touched = covering(this.z, dim, bbox);
        for (let s of touched) {
            if (s.key != key && this.index.has(s.key)) {
                tiles_invalidated.add(s.display);
            }
        }
    }
    pruneCache(added) {
        if (this.index.size() > this.maxLabeledTiles) {
            let max_key = undefined;
            let max_dist = 0;
            for (let key of this.index.keys()) {
                let split = key.split(":");
                let dist = Math.sqrt(Math.pow(+split[0] - added.data_tile.x, 2) +
                    Math.pow(+split[1] - added.data_tile.y, 2));
                if (dist > max_dist) {
                    max_dist = dist;
                    max_key = key;
                }
            }
            if (max_key)
                this.index.prune(max_key); // TODO cleanup
        }
    }
    add(prepared_tile) {
        let idx = toIndex(prepared_tile.data_tile);
        if (this.index.has(idx)) {
            return 0;
        }
        else {
            let timing = this.layout(prepared_tile);
            this.pruneCache(prepared_tile);
            return timing;
        }
    }
}
export class Labelers {
    constructor(scratch, labelRules, maxLabeledTiles, callback) {
        this.labelers = new Map();
        this.scratch = scratch;
        this.labelRules = labelRules;
        this.maxLabeledTiles = maxLabeledTiles;
        this.callback = callback;
    }
    add(prepared_tile) {
        var labeler = this.labelers.get(prepared_tile.z);
        if (labeler) {
            return labeler.add(prepared_tile);
        }
        else {
            labeler = new Labeler(prepared_tile.z, this.scratch, this.labelRules, this.maxLabeledTiles, this.callback);
            this.labelers.set(prepared_tile.z, labeler);
            return labeler.add(prepared_tile);
        }
    }
    getIndex(z) {
        let labeler = this.labelers.get(z);
        if (labeler)
            return labeler.index; // TODO cleanup
    }
}