import { Benchmark } from "@feltmaps/benchmarking";
import { Static } from "protomaps-local";
export default class StaticMap extends Benchmark {
  async bench() {
    const map = new Static({
      url: "http://localhost:9966/data/tiles/{z}/{x}/{y}.pbf",
    });
    const mapContainer = document.getElementById("map-container-local");
    await map.drawCanvas(mapContainer, [37.807, -122.271], 14);
  }
}
