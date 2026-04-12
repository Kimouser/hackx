import React from 'react';
import { View, Platform, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

const LeafletMap = ({ 
  center, 
  zoom, 
  threats, 
  safeZones, 
  safePaths, 
  pathColor = '#7c4dff', 
  pathWeight = 3,
  tileUrl = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
  tileAttribution = '&copy; <a href="https://carto.com/">CARTO</a>'
}) => {

  // 1. Generate the Javascript to inject markers AND paths
  const generateMapScript = (safeZonesData, threatsData, pathsData) => `
    // Function to draw SVG markers
    function addMarkersToMap(dataArray) {
      if (!dataArray) return;

      dataArray.forEach(item => {
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

    // NEW: Function to draw the safe paths (polylines)
    function addPathsToMap(pathsArray) {
      if (!pathsArray) return;
      
      pathsArray.forEach(path => {
        if (path.coords && path.coords.length > 0) {
          L.polyline(path.coords, {
            color: '${pathColor}',
            weight: ${pathWeight},
            opacity: 0.8,
            lineJoin: 'round'
          }).addTo(map);
        }
      });
    }

    // Convert React Native props to stringified JSON for the WebView
    const safeZonesDataString = ${JSON.stringify(safeZonesData || [])};
    const threatsDataString = ${JSON.stringify(threatsData || [])};
    const pathsDataString = ${JSON.stringify(pathsData || [])};

    // Execute the drawing functions
    addMarkersToMap(safeZonesDataString);
    addMarkersToMap(threatsDataString);
    addPathsToMap(pathsDataString);
  `;

  // 2. Build the HTML template with the critical Web CSS fixes
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
      // Initialize the map (using the center prop if available, else default to Mumbai)
      const startLat = ${center?.lat || 19.0730};
      const startLng = ${center?.lng || 72.8995};
      const startZoom = ${zoom || 15};

      const map = L.map('map', { zoomControl: false }).setView([startLat, startLng], startZoom);

      // FIXED: Actually use the tileUrl prop instead of hardcoding Stadia
      L.tileLayer('${tileUrl}', {
        attribution: '${tileAttribution}'
      }).addTo(map);

      // Inject your markers and paths here
      ${generateMapScript(safeZones, threats, safePaths)}
    </script>
  </body>
  </html>
  `;

  // 3. Render using Platform-specific logic to bypass the WebView bug on Web
  return (
    <View style={styles.container}>
      {Platform.OS === 'web' ? (
        <iframe
          srcDoc={mapHtmlString}
          style={{ width: '100%', height: '100%', border: 'none' }}
          title="Leaflet Map"
        />
      ) : (
        <WebView
          originWhitelist={['*']}
          source={{ html: mapHtmlString }}
          style={styles.webview}
          javaScriptEnabled={true}
          domStorageEnabled={true}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    backgroundColor: '#080810',
  },
  webview: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: 'transparent',
  },
});

export default LeafletMap;