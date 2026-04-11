const generateMarkersScript = (safeZones, threats) => `
  // 1. Create a reusable function inside the WebView
  function addMarkersToMap(dataArray) {
    if (!dataArray) return;
    
    dataArray.forEach(item => {
      if (item.svgHtml && item.lat && item.lng) {
        const customIcon = L.divIcon({
          html: item.svgHtml,       // Injects the raw SVG string
          className: '',            // CRITICAL: Overrides Leaflet's white background
          iconSize: [32, 32],
          iconAnchor: [16, 16],
          popupAnchor: [0, -16]
        });
        L.marker([item.lat, item.lng], { icon: customIcon }).addTo(map);
      }
    });
  }

  // 2. Inject the data safely (falling back to empty arrays if undefined)
  const safeZonesData = ${JSON.stringify(safeZones || [])};
  const threatsData = ${JSON.stringify(threats || [])};

  // 3. Render the markers
  addMarkersToMap(safeZonesData);
  addMarkersToMap(threatsData);
`;