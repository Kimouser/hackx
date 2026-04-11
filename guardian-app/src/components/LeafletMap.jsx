// Example of how your marker generation should look inside the LeafletMap component:

const generateMarkersScript = (safeZones, threats) => `
  // 1. Safe Zones
  const safeZonesData = ${JSON.stringify(safeZones)};
  safeZonesData.forEach(zone => {
    if (zone.svgHtml) {
      const icon = L.divIcon({
        html: zone.svgHtml,     // Injects the raw SVG string
        className: '',          // CRITICAL: Overrides Leaflet's white background
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -16]
      });
      L.marker([zone.lat, zone.lng], { icon }).addTo(map);
    }
  });

  // 2. Threats
  const threatsData = ${JSON.stringify(threats)};
  threatsData.forEach(threat => {
    if (threat.svgHtml) {
      const icon = L.divIcon({
        html: threat.svgHtml,   // Injects the raw SVG string
        className: '',          // CRITICAL: Overrides Leaflet's white background
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -16]
      });
      L.marker([threat.lat, threat.lng], { icon }).addTo(map);
    }
  });
`;