import React from 'react';
import { View, Platform, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

const LeafletMap = ({ center, zoom, threats, safeZones, safePaths }) => {

  // 1. Generate the Javascript to inject the markers
  const generateMarkersScript = (safeZonesData, threatsData) => `
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

    const safeZonesDataString = ${JSON.stringify(safeZonesData || [])};
    const threatsDataString = ${JSON.stringify(threatsData || [])};

    addMarkersToMap(safeZonesDataString);
    addMarkersToMap(threatsDataString);
  `;

  // 2. Build the HTML template with the critical CSS fixes
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
      // Initialize the map (using the center prop if available, else default to Ahmedabad)
      const startLat = ${center?.lat || 23.0225};
      const startLng = ${center?.lng || 72.5714};
      const startZoom = ${zoom || 13};

      const map = L.map('map', { zoomControl: false }).setView([startLat, startLng], startZoom);

      L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; Stadia Maps'
      }).addTo(map);

      // Inject your markers here
      ${generateMarkersScript(safeZones, threats)}
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