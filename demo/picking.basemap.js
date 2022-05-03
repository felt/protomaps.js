window.demoDescription = "A simple basemap displayed as a Leaflet layer.";

map.setView(new L.LatLng(25.0412,121.5177),16);

function replacer(key, value) {
  if(value instanceof Map) {
    return {
      dataType: 'Map',
      value: Array.from(value.entries()), // or with spread: value: [...value]
    };
  } else {
    return value;
  }
}

(function() {
    var layer = protomaps.leafletLayer({
        url:'https://api.protomaps.com/tiles/v2/{z}/{x}/{y}.pbf?key='+DEMO_KEY
    })
    layer.addTo(map);
    map.on("click", function(e) {
      const features = layer.queryRenderedFeatures(e.latlng.lng, e.latlng.lat);
      const featuresFromLabels = [];
      features.get("").labels.forEach(l => {
        if (l.featureId) {
          featuresFromLabels.push(layer.queryFeature("", l.layerName, l.featureId));
        }
      })
      console.log(JSON.stringify(features, replacer));
      console.log("Picked labels from features with ids: ", featuresFromLabels);
    })
})();
