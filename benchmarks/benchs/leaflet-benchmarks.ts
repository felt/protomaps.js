import { BenchmarkingSuite } from "@feltmaps/benchmarking";
import LeafletLocal from "./leafletLocal";
import LeafletMaster from "./leafletMaster";

const suite = new BenchmarkingSuite();
suite.register("Leaflet map", "local", new LeafletLocal());
suite.register("Leaflet map", "master", new LeafletMaster());
suite.run();
