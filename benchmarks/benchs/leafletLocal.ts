import { Benchmark } from "@feltmaps/benchmarking";
import * as L from "leaflet";
import { leafletLayer } from "protomaps-local";
export default class LeafletLocal extends Benchmark {
  layer: {
    on: (e: string, c: () => void) => void;
    addTo: (m: L.Map) => void;
    rerenderTiles: () => void;
  };
  setup() {
    const map = L.map("map-container-local").setView([37.807, -122.271], 13);
    this.layer = leafletLayer({
      url: "http://localhost:9966/data/tiles/{z}/{x}/{y}.pbf",
    });
    this.layer.addTo(map);
  }
  async bench() {
    const p = new Promise<void>((resolve) => {
      this.layer.on("rerender-end", () => {
        resolve();
      });
    });
    this.layer.rerenderTiles();
    return p;
  }
}
