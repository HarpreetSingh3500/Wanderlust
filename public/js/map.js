function initializeMap(latitude, longitude, title, location, country) {
  document.addEventListener("DOMContentLoaded", function () {
    var map = tt.map({
      key: "A9R3QV4o4iiTAmktvNSU8nxujqFqzFBY",
      container: "map",
      center: [longitude, latitude],
      zoom: 13,
    });

    var marker = new tt.Marker().setLngLat([longitude, latitude]).addTo(map);

    var popup = new tt.Popup({
      offset: 30,
    }).setHTML(`<b>${title}</b><br>${location}, ${country}`);

    marker.setPopup(popup);
  });
}
