/* Dashboard-map bootstrap kept separate from the generated login.html shell. */
document.addEventListener('DOMContentLoaded', function () {
  if (!document.getElementById('dash-interactive-map') || !window.L) return;
  window.dashboardMap = L.map('dash-interactive-map', { zoomControl: true, scrollWheelZoom: true }).setView([31.1471, 75.3412], 8);
  const map = window.dashboardMap;
  L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { attribution: 'Tiles &copy; Esri' }).addTo(map);
  setTimeout(() => map.invalidateSize(), 300);
  fetch('assets/punjab_districts.geojson').then(response => response.json()).then(data => {
    const geoLayer = L.geoJSON(data, {
      style: () => ({ color: '#F2A123', weight: 2.5, fillColor: 'rgba(242, 161, 35, 0.15)', fillOpacity: 0.15 }),
      onEachFeature(feature, layer) {
        if (feature.properties && feature.properties.NAME_2) layer.bindTooltip(feature.properties.NAME_2, { permanent: true, direction: 'center', className: 'map-district-label' });
        layer.on('mouseover', function () { this.setStyle({ fillOpacity: 0.35, weight: 3 }); });
        layer.on('mouseout', function () { geoLayer.resetStyle(this); });
      }
    }).addTo(map);
    const bounds = geoLayer.getBounds();
    window.dashboardMapBounds = bounds;
    map.fitBounds(bounds, { padding: [20, 20] });
    map.setMaxBounds(bounds.pad(0.15));
    map.setMinZoom(map.getZoom() - 1);
  });
});
