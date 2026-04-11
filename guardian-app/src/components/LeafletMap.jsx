import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import colors from '../theme/colors';

/**
 * Cross-platform LeafletJS map component.
 * Renders Leaflet inside a WebView (mobile) or iframe (web).
 *
 * Props:
 *  - center: { lat, lng }
 *  - zoom: number
 *  - threats: [{ id, title, category, severity, latitude, longitude, upvotes }]
 *  - safeZones: [{ id, name, category, latitude, longitude, phone }]
 *  - safePaths: [{ coords: [[lat,lng],[lat,lng],...] }]
 *  - journeyRoute: [[lat,lng],[lat,lng],...]
 *  - onMarkerPress: (type, item) => void
 */
const LeafletMap = ({ center, zoom = 13, threats = [], safeZones = [], safePaths = [], journeyRoute = [] }) => {
  const iframeRef = useRef(null);

  const severityColor = {
    low: '#ffaa00',
    medium: '#ff8800',
    high: '#ff4444',
    critical: '#ff0000',
  };

  const categoryIcon = {
    hospital: '🏥',
    police_station: '👮',
    fire_station: '🚒',
    '24x7_hotspot': '☕',
    pharmacy: '💊',
    shelter: '🏠',
    other: '📍',
  };

  const threatMarkers = threats
    .map(
      (t) => `
      L.circleMarker([${t.latitude}, ${t.longitude}], {
        radius: ${Math.min(8 + t.upvotes * 0.5, 20)},
        color: '${severityColor[t.severity] || '#ff4444'}',
        fillColor: '${severityColor[t.severity] || '#ff4444'}',
        fillOpacity: 0.35,
        weight: 2
      }).addTo(map).bindPopup(
        '<div style="font-family:system-ui;min-width:180px">' +
        '<div style="color:#ff4444;font-weight:700;font-size:13px">⚠ THREAT ZONE</div>' +
        '<div style="font-weight:600;margin:4px 0">${t.title.replace(/'/g, "\\'")}</div>' +
        '<div style="font-size:12px;color:#888">Category: ${t.category.replace('_', ' ')}</div>' +
        '<div style="font-size:12px;color:#888">Severity: ${t.severity}</div>' +
        '<div style="font-size:12px;color:#888">Upvotes: ${t.upvotes}</div>' +
        '</div>'
      );`
    )
    .join('\n');

  const safeMarkers = safeZones
    .map(
      (z) => `
      L.marker([${z.latitude}, ${z.longitude}], {
        icon: L.divIcon({
          html: '<div style="font-size:22px;text-align:center">${categoryIcon[z.category] || '📍'}</div>',
          className: '',
          iconSize: [30, 30],
          iconAnchor: [15, 15]
        })
      }).addTo(map).bindPopup(
        '<div style="font-family:system-ui;min-width:180px">' +
        '<div style="color:#00ff88;font-weight:700;font-size:13px">✓ SAFE ZONE</div>' +
        '<div style="font-weight:600;margin:4px 0">${z.name.replace(/'/g, "\\'")}</div>' +
        '<div style="font-size:12px;color:#888">Category: ${z.category.replace('_', ' ')}</div>' +
        '${z.phone ? '<div style="font-size:12px;color:#888">Phone: ' + z.phone + '</div>' : ''}' +
        '</div>'
      );`
    )
    .join('\n');

  const safePathLines = safePaths
    .map(
      (p) => `
      L.polyline(${JSON.stringify(p.coords)}, {
        color: '#00ff88',
        weight: 5,
        opacity: 0.8,
        dashArray: null,
        className: 'safe-path-glow'
      }).addTo(map);`
    )
    .join('\n');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"/>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        *{margin:0;padding:0;box-sizing:border-box}
        html,body,#map{width:100%;height:100%;background:#0a0a0a}
        .leaflet-tile-pane{filter:brightness(0.75) contrast(1.1) saturate(0.8)}
        .leaflet-popup-content-wrapper{background:#1a1a1a;color:#fff;border-radius:10px;border:1px solid #333}
        .leaflet-popup-tip{background:#1a1a1a}
        .leaflet-popup-close-button{color:#666!important}
        .leaflet-control-zoom a{background:#1a1a1a!important;color:#00ff88!important;border-color:#333!important}
        .leaflet-control-attribution{background:rgba(10,10,10,0.7)!important;color:#444!important;font-size:9px}
        .leaflet-control-attribution a{color:#555!important}
        @keyframes pulse{0%,100%{opacity:0.35}50%{opacity:0.6}}
        .leaflet-interactive{animation:pulse 3s infinite}
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        var map = L.map('map', {
          center: [${center?.lat || 23.0225}, ${center?.lng || 72.5714}],
          zoom: ${zoom},
          zoomControl: true,
          attributionControl: true
        });

        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
          attribution: '© <a href="https://www.openstreetmap.org/copyright">OSM</a> © <a href="https://carto.com/">CARTO</a>',
          maxZoom: 19
        }).addTo(map);

        // User location marker
        L.circleMarker([${center?.lat || 23.0225}, ${center?.lng || 72.5714}], {
          radius: 8, color: '#4488ff', fillColor: '#4488ff', fillOpacity: 0.9, weight: 3
        }).addTo(map).bindPopup('<div style="font-family:system-ui;color:#fff"><b>📍 You are here</b></div>');

        // Threat zones
        ${threatMarkers}

        // Safe zones
        ${safeMarkers}

        // Journey route line
        ${journeyRoute && journeyRoute.length ? `
        L.polyline(${JSON.stringify(journeyRoute)}, {
          color: '#3399ff',
          weight: 5,
          opacity: 0.9,
          dashArray: '8,6'
        }).addTo(map).bindPopup('<div style="font-family:system-ui;color:#fff">🚗 Planned journey route</div>');
        ` : ''}

        // Safe paths (glowing green lines)
        ${safePathLines}
      </script>
    </body>
    </html>
  `;

  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        <iframe
          ref={iframeRef}
          srcDoc={html}
          style={{ width: '100%', height: '100%', border: 'none' }}
          title="Guardian Map"
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <WebView
        source={{ html }}
        style={styles.webview}
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState
        originWhitelist={['*']}
        mixedContentMode="always"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  webview: {
    flex: 1,
    backgroundColor: colors.bg,
  },
});

export default LeafletMap;
