declare var L: any;

// @ts-ignore
import Point from "@mapbox/point-geometry";

import { PreparedTile, sourcesToViews, sourceToView, View } from "../view";
import { painter, Rule } from "../painter";
import { IndexedLabel, Labelers, LabelRule } from "../labeler";
import { light } from "../default_style/light";
import { dark } from "../default_style/dark";
import { paintRules, labelRules } from "../default_style/style";
import { ProtomapsEvent } from "../events";
import { LabelPickedFeature, PickedFeature } from "../tilecache";
import { BasemapLayerSourceName } from "..";

const LeafletTileSize = 258;

const timer = (duration: number) => {
  return new Promise<void>((resolve, reject) => {
    setTimeout(() => {
      resolve();
    }, duration);
  });
};

// replacement for Promise.allSettled (requires ES2020+)
// this is called for every tile render,
// so ensure font loading failure does not make map rendering fail
type Status = {
  status: string;
  value?: any;
  reason: Error;
};
const reflect = (promise: Promise<Status>) => {
  return promise.then(
    (v) => {
      return { status: "fulfilled", value: v };
    },
    (error) => {
      return { status: "rejected", reason: error };
    }
  );
};

export type DataSourceOptions = {
  url: string;
  maxDataZoom?: number;
  levelDiff?: number;
};
export type DataSource = {
  name: string;
  options: DataSourceOptions;
};

const leafletLayer = (options: any): any => {
  class LeafletLayer extends L.GridLayer {
    constructor(options: any) {
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
      this.tasks = options.tasks || [];

      this.views = sourcesToViews(options);

      this.debug = options.debug;
      let scratch = document.createElement("canvas").getContext("2d");
      this.scratch = scratch;
      this.onTilesInvalidated = (tiles: Set<string>) => {
        tiles.forEach((t) => {
          this.rerenderTile(t);
        });
      };
      this.labelers = new Labelers(
        this.scratch,
        this.label_rules,
        16,
        this.onTilesInvalidated
      );
      this.tile_size = LeafletTileSize * window.devicePixelRatio;
      this.tileDelay = options.tileDelay || 3;
      this.lang = options.lang;

      // bound instance of function
      this.inspector = this.inspect(this);
    }

    public setDefaultStyle(
      darkOption: boolean,
      shade: string,
      language1: string[],
      language2: string[]
    ) {
      let theme = darkOption ? dark : light;
      this.paint_rules = paintRules(theme, shade);
      this.label_rules = labelRules(theme, shade, language1, language2);
    }

    public async renderTile(
      coords: any,
      element: any,
      key: string,
      done = () => {}
    ) {
      this.lastRequestedZ = coords.z;

      let promises = [];
      for (const [k, v] of this.views) {
        let promise = v.getDisplayTile(coords);
        promises.push({ key: k, promise: promise });
      }
      let tile_responses = await Promise.all(
        promises.map((o) => {
          return o.promise.then(
            (v: any) => {
              return { status: "fulfilled", value: v, key: o.key };
            },
            (error: Error) => {
              return { status: "rejected", reason: error, key: o.key };
            }
          );
        })
      );

      let prepared_tilemap = new Map<string, PreparedTile>();
      for (const tile_response of tile_responses) {
        if (tile_response.status === "fulfilled") {
          prepared_tilemap.set(tile_response.key, tile_response.value);
        }
      }

      if (element.key != key) return;
      if (this.lastRequestedZ !== coords.z) return;

      await Promise.all(this.tasks.map(reflect));

      if (element.key != key) return;
      if (this.lastRequestedZ !== coords.z) return;

      let layout_time = this.labelers.add(coords.z, prepared_tilemap);

      if (element.key != key) return;
      if (this.lastRequestedZ !== coords.z) return;

      let label_data = this.labelers.getIndex(coords.z);

      if (!this._map) return; // the layer has been removed from the map

      let center = this._map.getCenter().wrap();
      let pixelBounds = this._getTiledPixelBounds(center),
        tileRange = this._pxBoundsToTileRange(pixelBounds),
        tileCenter = tileRange.getCenter();
      let priority = coords.distanceTo(tileCenter) * this.tileDelay;

      await timer(priority);

      if (element.key != key) return;
      if (this.lastRequestedZ !== coords.z) return;

      let BUF = 16;
      let bbox = {
        minX: 256 * coords.x - BUF,
        minY: 256 * coords.y - BUF,
        maxX: 256 * (coords.x + 1) + BUF,
        maxY: 256 * (coords.y + 1) + BUF,
      };
      let origin = new Point(256 * coords.x + 0.5, 256 * coords.y + 0.5);

      element.width = this.tile_size;
      element.height = this.tile_size;
      let ctx = element.getContext("2d");
      ctx.setTransform(
        this.tile_size / LeafletTileSize,
        0,
        0,
        this.tile_size / LeafletTileSize,
        0,
        0
      );
      ctx.clearRect(0, 0, LeafletTileSize, LeafletTileSize);

      if (this.backgroundColor) {
        ctx.save();
        ctx.fillStyle = this.backgroundColor;
        ctx.fillRect(0, 0, LeafletTileSize, LeafletTileSize);
        ctx.restore();
      }

      var painting_time = 0;

      painting_time = painter(
        ctx,
        coords.z,
        [prepared_tilemap],
        label_data,
        this.paint_rules,
        bbox,
        origin,
        false,
        this.debug,
        this.xray
      );

      if (this.debug) {
        ctx.save();
        ctx.fillStyle = this.debug;
        ctx.font = "600 12px sans-serif";
        ctx.fillText(coords.z + " " + coords.x + " " + coords.y, 4, 14);

        if (prepared_tilemap.size !== 0) {
          const [firstTile] = prepared_tilemap.values();
          const data_tile = firstTile.data_tile;
          ctx.font = "200 12px sans-serif";
          ctx.fillText(
            data_tile.z + " " + data_tile.x + " " + data_tile.y,
            4,
            28
          );
        }

        ctx.font = "600 10px sans-serif";
        if (painting_time > 8) {
          ctx.fillText(painting_time.toFixed() + " ms paint", 4, 42);
        }
        if (layout_time > 8) {
          ctx.fillText(layout_time.toFixed() + " ms layout", 4, 56);
        }
        ctx.strokeStyle = this.debug;

        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(1, 1);
        ctx.lineTo(1, 256);
        ctx.stroke();

        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(1, 1);
        ctx.lineTo(256, 1);
        ctx.stroke();

        ctx.restore();
      }
      done();
    }

    public rerenderTile(key: string) {
      for (let unwrapped_k in this._tiles) {
        let wrapped_coord = this._wrapCoords(
          this._keyToTileCoords(unwrapped_k)
        );
        if (key === this._tileCoordsToKey(wrapped_coord)) {
          this.renderTile(wrapped_coord, this._tiles[unwrapped_k].el, key);
        }
      }
    }

    public clearLayout() {
      this.labelers = new Labelers(
        this.scratch,
        this.label_rules,
        16,
        this.onTilesInvalidated
      );
    }

    public rerenderTiles() {
      this.fire(ProtomapsEvent.RerenderStart);
      const promises = [];
      for (let unwrapped_k in this._tiles) {
        let wrapped_coord = this._wrapCoords(
          this._keyToTileCoords(unwrapped_k)
        );
        let key = this._tileCoordsToKey(wrapped_coord);
        promises.push(
          this.renderTile(wrapped_coord, this._tiles[unwrapped_k].el, key)
        );
      }
      Promise.all(promises).then(() => this.fire(ProtomapsEvent.RerenderEnd));
    }

    public createTile(coords: any, showTile: any) {
      let element = L.DomUtil.create("canvas", "leaflet-tile");
      element.lang = this.lang;

      let key = this._tileCoordsToKey(coords);
      element.key = key;

      this.renderTile(coords, element, key, () => {
        showTile(null, element);
      });

      return element;
    }

    public _removeTile(key: string) {
      let tile = this._tiles[key];
      if (!tile) {
        return;
      }
      tile.el.removed = true;
      tile.el.key = undefined;
      L.DomUtil.removeClass(tile.el, "leaflet-tile-loaded");
      tile.el.width = tile.el.height = 0;
      L.DomUtil.remove(tile.el);
      delete this._tiles[key];
      this.fire("tileunload", {
        tile: tile.el,
        coords: this._keyToTileCoords(key),
      });
    }

    public queryFeatures(lng: number, lat: number) {
      let featuresBySourceName = new Map();
      for (var [sourceName, view] of this.views) {
        featuresBySourceName.set(
          sourceName,
          view.queryFeatures(lng, lat, this._map.getZoom())
        );
      }
      return featuresBySourceName;
    }

    public queryRenderedFeatures(
      lng: number,
      lat: number,
      ignoreBasemap = false
    ) {
      // Instead of getting all the features, we only get
      // the rendered ones
      let featuresBySourceName = new Map();
      for (var [sourceName, view] of this.views) {
        if (ignoreBasemap && sourceName === BasemapLayerSourceName) continue;
        const z = this._map.getZoom();
        const viewFeatures = view.queryFeatures(lng, lat, z, 32);
        const zoom = Math.round(z);
        const labelTree = this.labelers.getIndex(zoom);
        let labelFeatures = new Set<IndexedLabel>();
        let info;
        if (labelTree) {
          info = view.getLngLatTileInfo(lat, lng, zoom);
          labelFeatures = labelTree.searchBbox(info.bbox, Infinity);
        }
        const featuresPerLayer = viewFeatures.reduce(
          (agg: { [key: string]: PickedFeature[] }, f: PickedFeature) => {
            if (!agg[f.layerName]) agg[f.layerName] = [];
            agg[f.layerName].push(f);
            return agg;
          },
          {}
        );
        const labelFeaturesPerSource: { [key: string]: LabelPickedFeature[] } =
          {};
        for (let feature of labelFeatures) {
          if (
            (feature.dataLayer || !ignoreBasemap) &&
            (feature.dataSource === sourceName ||
              (sourceName == BasemapLayerSourceName && !feature.dataSource))
          ) {
            if (!labelFeaturesPerSource[sourceName])
              labelFeaturesPerSource[sourceName] = [];
            labelFeaturesPerSource[sourceName].push({
              featureId: feature.featureId,
              layerName: feature.dataLayer || "",
              tileX: info.tileX,
              tileY: info.tileY,
              zoom: info.zoom,
            });
          }
        }
        const features = this.getRenderedFeatures(featuresPerLayer);
        let labelArray: LabelPickedFeature[] =
          labelFeaturesPerSource[sourceName] || [];
        featuresBySourceName.set(sourceName, {
          features,
          labels: labelArray,
        });
      }
      return featuresBySourceName;
    }

    private getRenderedFeatures(featuresPerLayer: {
      [key: string]: PickedFeature[];
    }): PickedFeature[] {
      const z = this._map.getZoom();
      const features = [];
      for (let rule of this.paint_rules) {
        if (rule.minzoom && z < rule.minzoom) continue;
        if (rule.maxzoom && z > rule.maxzoom) continue;

        const layerFeatures = featuresPerLayer[rule.dataLayer];
        if (!layerFeatures) continue;

        if (rule.filter) {
          for (let pickedFeature of layerFeatures) {
            if (rule.filter(z, pickedFeature.feature)) {
              features.push({
                ...pickedFeature,
                extra: rule.extra,
              });
            }
          }
        } else {
          features.push(
            ...layerFeatures.map((f: PickedFeature) => {
              return { ...f, extra: rule.extra };
            })
          );
        }
      }
      return features;
    }

    public queryFeature(srcName: string, dataLayer: string, id: number) {
      const view = this.views.get(srcName);
      if (view) {
        const feature = view.queryFeature(dataLayer, id);
        const features = this.getRenderedFeatures({
          [dataLayer]: [
            {
              feature: feature,
              layerName: dataLayer,
              tileX: 0,
              tileY: 0,
              zoom: 0,
            },
          ],
        });
        if (features.length !== 0) return features[0];
      }
    }

    public inspect(layer: LeafletLayer) {
      return (ev: any) => {
        let typeGlyphs = ["◎", "⟍", "◻"];
        let wrapped = layer._map.wrapLatLng(ev.latlng);
        let resultsBySourceName = layer.queryFeatures(wrapped.lng, wrapped.lat);
        var content = "";
        let firstRow = true;

        for (var [sourceName, results] of resultsBySourceName) {
          for (var result of results) {
            if (this.xray && this.xray !== true) {
              if (
                !(
                  this.xray.dataSource === sourceName &&
                  this.xray.dataLayer === result.layerName
                )
              ) {
                continue;
              }
            }
            content =
              content +
              `<div style="margin-top:${firstRow ? 0 : 0.5}em">${
                typeGlyphs[result.feature.geomType - 1]
              } <b>${sourceName} ${sourceName ? "/" : ""} ${
                result.layerName
              }</b> ${result.feature.id || ""}</div>`;
            for (const prop in result.feature.props) {
              content =
                content +
                `<div style="font-size:0.9em">${prop} = ${result.feature.props[prop]}</div>`;
            }
            firstRow = false;
          }
        }
        if (firstRow) {
          content = "No features.";
        }
        L.popup()
          .setLatLng(ev.latlng)
          .setContent(
            '<div style="max-height:400px;overflow-y:scroll;padding-right:8px">' +
              content +
              "</div>"
          )
          .openOn(layer._map);
      };
    }

    public addInspector(map: any) {
      return map.on("click", this.inspector);
    }

    public removeInspector(map: any) {
      return map.off("click", this.inspector);
    }

    public updateDataSources(
      dataSources: DataSource[],
      paintRules: Rule[],
      labelRules: LabelRule[]
    ) {
      const dataLabelRules: LabelRule[] = [];
      const dataSourcesPerName = dataSources.reduce(
        (agg: { [key: string]: DataSource }, source) => {
          agg[source.name] = source;
          return agg;
        },
        {}
      );

      this.paint_rules = [...paintRules];
      this.label_rules = [...labelRules];

      this.views.forEach((_: View, k: string) => {
        if (!dataSourcesPerName[k]) {
          this.views.delete(k);
        }
      });
      dataSources.forEach((d) => {
        if (!this.views.has(d.name)) {
          this.views.set(d.name, sourceToView(d.options));
        }
      });
    }

    private subscribeChildEvents() {
      this.eventQueue.subscribe(ProtomapsEvent.TileFetchStart, this.fireEvent);
      this.eventQueue.subscribe(ProtomapsEvent.TileFetchEnd, this.fireEvent);
    }

    private fireEvent(e: ProtomapsEvent) {
      this.fire(e);
    }
  }
  return new LeafletLayer(options);
};

export { leafletLayer };
