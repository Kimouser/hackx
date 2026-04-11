// 1. THE JAVASCRIPT MARKER INJECTION
const generateMarkersScript = (safeZones, threats) => `
  function addMarkersToMap(dataArray) {
    if (!dataArray) return;
    
    dataArray.forEach(item => {
      // Safely grab coordinates whether your DB uses 'lat' or 'latitude'
      const markerLat = item.lat || item.latitude;
      const markerLng = item.lng || item.longitude;

      if (item.svgHtml && markerLat && markerLng) {
        const customIcon = L.divIcon({
          html: item.svgHtml,       
          className: '',            // Overrides Leaflet's white background
          iconSize: [32, 32],
          iconAnchor: [16, 16],
          popupAnchor: [0, -16]
        });
        L.marker([markerLat, markerLng], { icon: customIcon }).addTo(map);
      }
    });
  }

  const safeZonesData = ${JSON.stringify(safeZones || [])};
  const threatsData = ${JSON.stringify(threats || [])};

  addMarkersToMap(safeZonesData);
  addMarkersToMap(threatsData);
`;


// 2. THE HTML TEMPLATE (Make sure your CSS has these height rules!)
const mapHtmlString = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    /* CRITICAL FOR EXPO WEB: Forces the iframe and map to fill the screen */
    html, body {
      margin: 0;
      padding: 0;
      height: 100%; 
      width: 100%;
      background-color: #080810;
    }
    #map {
      height: 100vh; 
      width: 100vw;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    // Initialize the map
    const map = L.map('map', { zoomControl: false }).setView([23.0225, 72.5714], 13);
    
    L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; Stadia Maps'
    }).addTo(map);

    // Inject your markers here
    ${generateMarkersScript(safeZones, threats)}
  </script>
</body>
</html>
`;