var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
// @ts-ignore
import Point from "@mapbox/point-geometry";
import { ZxySource, PmtilesSource, TileCache } from "../tilecache";
import { View } from "../view";
import { painter, xray } from "../painter";
import { Labelers } from "../labeler";
import { light } from "../default_style/light";
import { dark } from "../default_style/dark";
import { paintRules, labelRules } from "../default_style/style";
import { EventQueue, ProtomapsEvent } from "../events";
const timer = (duration) => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve();
        }, duration);
    });
};
const reflect = (promise) => {
    return promise.then((v) => {
        return { status: "fulfilled", value: v };
    }, (error) => {
        return { status: "rejected", reason: error };
    });
};
const leafletLayer = (options) => {
    class LeafletLayer extends L.GridLayer {
        constructor(options) {
            if (options.noWrap && !options.bounds)
                options.bounds = [
                    [-90, -180],
                    [90, 180],
                ];
            if (options.attribution == null)
                options.attribution =
                    '<a href="https://protomaps.com">Protomaps</a> © <a href="https://openstreetmap.org/copyright">OpenStreetMap</a>';
            super(options);
            let theme = options.dark ? dark : light;
            this.paint_rules =
                options.paint_rules || paintRules(theme, options.shade);
            this.label_rules =
                options.label_rules ||
                    labelRules(theme, options.shade, options.language1, options.language2);
            this.backgroundColor = options.backgroundColor;
            this.lastRequestedZ = undefined;
            this.xray = options.xray;
            let source;
            if (options.url.url) {
                source = new PmtilesSource(options.url, true);
            }
            else if (options.url.endsWith(".pmtiles")) {
                source = new PmtilesSource(options.url, true);
            }
            else {
                source = new ZxySource(options.url, true);
            }
            let maxDataZoom = 14;
            if (options.maxDataZoom) {
                maxDataZoom = options.maxDataZoom;
            }
            this.levelDiff = options.levelDiff === undefined ? 2 : options.levelDiff;
            this.eventQueue = new EventQueue();
            this.subscribeChildEvents();
            this.tasks = options.tasks || [];
            let cache = new TileCache(source, (256 * 1) << this.levelDiff);
            this.view = new View(cache, maxDataZoom, this.levelDiff, this.eventQueue);
            this.debug = options.debug;
            let scratch = document.createElement("canvas").getContext("2d");
            this.scratch = scratch;
            this.onTilesInvalidated = (tiles) => {
                tiles.forEach((t) => {
                    this.rerenderTile(t);
                });
            };
            this.labelers = new Labelers(this.scratch, this.label_rules, 16, this.onTilesInvalidated);
            this.tile_size = 256 * window.devicePixelRatio;
            this.tileDelay = options.tileDelay || 3;
            this.lang = options.lang;
            // bound instance of function
            this.inspector = this.inspect(this);
        }
        setDefaultStyle(darkOption, shade, language1, language2) {
            let theme = darkOption ? dark : light;
            this.paint_rules = paintRules(theme, shade);
            this.label_rules = labelRules(theme, shade, language1, language2);
        }
        renderTile(coords, element, key, done = () => { }) {
            return __awaiter(this, void 0, void 0, function* () {
                this.lastRequestedZ = coords.z;
                var prepared_tile;
                try {
                    prepared_tile = yield this.view.getDisplayTile(coords);
                }
                catch (e) {
                    if (e.name == "AbortError")
                        return;
                    else
                        throw e;
                }
                if (element.key != key)
                    return;
                if (this.lastRequestedZ !== coords.z)
                    return;
                yield Promise.all(this.tasks.map(reflect));
                if (element.key != key)
                    return;
                if (this.lastRequestedZ !== coords.z)
                    return;
                let layout_time = yield this.labelers.add(prepared_tile);
                if (element.key != key)
                    return;
                if (this.lastRequestedZ !== coords.z)
                    return;
                let label_data = this.labelers.getIndex(prepared_tile.z);
                if (!this._map)
                    return; // the layer has been removed from the map
                let center = this._map.getCenter().wrap();
                let pixelBounds = this._getTiledPixelBounds(center), tileRange = this._pxBoundsToTileRange(pixelBounds), tileCenter = tileRange.getCenter();
                let priority = coords.distanceTo(tileCenter) * this.tileDelay;
                yield timer(priority);
                if (element.key != key)
                    return;
                if (this.lastRequestedZ !== coords.z)
                    return;
                let BUF = 16;
                let bbox = {
                    minX: 256 * coords.x - BUF,
                    minY: 256 * coords.y - BUF,
                    maxX: 256 * (coords.x + 1) + BUF,
                    maxY: 256 * (coords.y + 1) + BUF,
                };
                let origin = new Point(256 * coords.x, 256 * coords.y);
                element.width = this.tile_size;
                element.height = this.tile_size;
                let ctx = element.getContext("2d");
                ctx.setTransform(this.tile_size / 256, 0, 0, this.tile_size / 256, 0, 0);
                ctx.clearRect(0, 0, 256, 256);
                if (this.backgroundColor) {
                    ctx.save();
                    ctx.fillStyle = this.backgroundColor;
                    ctx.fillRect(0, 0, 256, 256);
                    ctx.restore();
                }
                var painting_time = 0;
                if (this.xray) {
                    painting_time = xray(ctx, [prepared_tile], bbox, origin, false, this.debug);
                }
                else {
                    painting_time = painter(ctx, [prepared_tile], label_data, this.paint_rules, bbox, origin, false, this.debug);
                }
                if (this.debug) {
                    let data_tile = prepared_tile.data_tile;
                    ctx.save();
                    ctx.fillStyle = this.debug;
                    ctx.font = "600 12px sans-serif";
                    ctx.fillText(coords.z + " " + coords.x + " " + coords.y, 4, 14);
                    ctx.font = "200 12px sans-serif";
                    ctx.fillText(data_tile.z + " " + data_tile.x + " " + data_tile.y, 4, 28);
                    ctx.font = "600 10px sans-serif";
                    if (painting_time > 8) {
                        ctx.fillText(painting_time.toFixed() + " ms paint", 4, 42);
                    }
                    if (layout_time > 8) {
                        ctx.fillText(layout_time.toFixed() + " ms layout", 4, 56);
                    }
                    ctx.strokeStyle = this.debug;
                    ctx.lineWidth =
                        coords.x / (1 << this.levelDiff) === data_tile.x ? 2.5 : 0.5;
                    ctx.beginPath();
                    ctx.moveTo(0, 0);
                    ctx.lineTo(0, 256);
                    ctx.stroke();
                    ctx.lineWidth =
                        coords.y / (1 << this.levelDiff) === data_tile.y ? 2.5 : 0.5;
                    ctx.beginPath();
                    ctx.moveTo(0, 0);
                    ctx.lineTo(256, 0);
                    ctx.stroke();
                    ctx.restore();
                }
                done();
            });
        }
        rerenderTile(key) {
            for (let unwrapped_k in this._tiles) {
                let wrapped_coord = this._wrapCoords(this._keyToTileCoords(unwrapped_k));
                if (key === this._tileCoordsToKey(wrapped_coord)) {
                    this.renderTile(wrapped_coord, this._tiles[unwrapped_k].el, key);
                }
            }
        }
        clearLayout() {
            this.labelers = new Labelers(this.scratch, this.label_rules, 16, this.onTilesInvalidated);
        }
        rerenderTiles() {
            this.fire(ProtomapsEvent.RerenderStart);
            const promises = [];
            for (let unwrapped_k in this._tiles) {
                let wrapped_coord = this._wrapCoords(this._keyToTileCoords(unwrapped_k));
                let key = this._tileCoordsToKey(wrapped_coord);
                promises.push(this.renderTile(wrapped_coord, this._tiles[unwrapped_k].el, key));
            }
            Promise.all(promises).then(() => this.fire(ProtomapsEvent.RerenderEnd));
        }
        createTile(coords, showTile) {
            let element = L.DomUtil.create("canvas", "leaflet-tile");
            element.lang = this.lang;
            let key = this._tileCoordsToKey(coords);
            element.key = key;
            this.renderTile(coords, element, key, () => {
                showTile(null, element);
            });
            return element;
        }
        _removeTile(key) {
            let tile = this._tiles[key];
            if (!tile) {
                return;
            }
            tile.el.removed = true;
            tile.el.key = undefined;
            L.DomUtil.removeClass(tile.el, "leaflet-tile-loaded");
            L.DomUtil.remove(tile.el);
            delete this._tiles[key];
            this.fire("tileunload", {
                tile: tile.el,
                coords: this._keyToTileCoords(key),
            });
        }
        queryFeatures(lng, lat) {
            return this.view.queryFeatures(lng, lat, this._map.getZoom());
        }
        inspect(layer) {
            return (ev) => {
                let typeNames = ["Point", "Line", "Polygon"];
                let wrapped = layer._map.wrapLatLng(ev.latlng);
                let results = layer.queryFeatures(wrapped.lng, wrapped.lat);
                var content = "";
                for (var i = 0; i < results.length; i++) {
                    let result = results[i];
                    content =
                        content +
                            `<div><b>${result.layerName}</b> ${typeNames[result.feature.geomType - 1]} ${result.feature.id}</div>`;
                    for (const prop in result.feature.props) {
                        content =
                            content + `<div>${prop}=${result.feature.props[prop]}</div>`;
                    }
                    if (i < results.length - 1)
                        content = content + "<hr/>";
                }
                if (results.length == 0) {
                    content = "No features.";
                }
                L.popup().setLatLng(ev.latlng).setContent(content).openOn(layer._map);
            };
        }
        addInspector(map) {
            return map.on("click", this.inspector);
        }
        removeInspector(map) {
            return map.off("click", this.inspector);
        }
        subscribeChildEvents() {
            this.eventQueue.subscribe(ProtomapsEvent.TileFetchStart, this.fireEvent);
            this.eventQueue.subscribe(ProtomapsEvent.TileFetchEnd, this.fireEvent);
        }
        fireEvent(e) {
            this.fire(e);
        }
    }
    return new LeafletLayer(options);
};
export { leafletLayer };