import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import colors from '../theme/colors';

/**
 * Cross-platform LeafletJS map with dual-route AI rendering.
 *
 * Props:
 *  - center: { lat, lng }
 *  - zoom: number
 *  - threats: [{ id, title, category, severity, latitude, longitude, upvotes }]
 *  - safeZones: [{ id, name, category, latitude, longitude, phone }]
 *  - fastestRoute: [[lat,lng], ...] — blue route
 *  - safestRoute: [[lat,lng], ...] — green glowing route
 *  - aiScore: { fastest_route_score, safest_route_score, reasoning }
 *  - threatClusters: [{ center: {lat,lng}, radius, riskLevel }]
 */
const LeafletMap = ({
  center,
  zoom = 13,
  threats = [],
  safeZones = [],
  fastestRoute = [],
  safestRoute = [],
  aiScore = null,
  threatClusters = [],
}) => {
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
        radius: ${Math.min(6 + t.upvotes * 0.4, 18)},
        color: '${severityColor[t.severity] || '#ff4444'}',
        fillColor: '${severityColor[t.severity] || '#ff4444'}',
        fillOpacity: 0.3,
        weight: 1.5
      }).addTo(map).bindPopup(
        '<div style="font-family:system-ui;min-width:160px">' +
        '<div style="color:#ff4444;font-weight:700;font-size:11px">⚠ THREAT</div>' +
        '<div style="font-weight:600;margin:3px 0;font-size:12px">${t.title.replace(/'/g, "\\'")}</div>' +
        '<div style="font-size:11px;color:#888">${t.category.replace('_', ' ')} · ${t.severity} · ▲${t.upvotes}</div>' +
        '</div>'
      );`
    )
    .join('\n');

  const safeMarkers = safeZones
    .map(
      (z) => `
      L.marker([${z.latitude}, ${z.longitude}], {
        icon: L.divIcon({
          html: '<div style="font-size:18px;text-align:center;filter:drop-shadow(0 0 4px rgba(0,255,136,0.5))">${categoryIcon[z.category] || '📍'}</div>',
          className: '',
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        })
      }).addTo(map).bindPopup(
        '<div style="font-family:system-ui;min-width:160px">' +
        '<div style="color:#00ff88;font-weight:700;font-size:11px">✓ SAFE ZONE</div>' +
        '<div style="font-weight:600;margin:3px 0;font-size:12px">${z.name.replace(/'/g, "\\'")}</div>' +
        '${z.phone ? '<div style="font-size:11px;color:#888">☎ ' + z.phone + '</div>' : ''}' +
        '</div>'
      );`
    )
    .join('\n');

  // K-Means threat cluster visualization
  const clusterCircles = threatClusters
    .map(
      (c) => `
      L.circle([${c.center.lat}, ${c.center.lng}], {
        radius: ${Math.max(c.radius || 300, 200)},
        color: '${c.riskLevel === 'critical' ? '#ff0000' : c.riskLevel === 'high' ? '#ff4444' : '#ff8800'}',
        fillColor: '${c.riskLevel === 'critical' ? '#ff0000' : '#ff4444'}',
        fillOpacity: 0.08,
        weight: 1,
        dashArray: '6 4'
      }).addTo(map);`
    )
    .join('\n');

  // Blue fastest route
  const fastestLine = fastestRoute.length > 1
    ? `L.polyline(${JSON.stringify(fastestRoute)}, {
        color: '#4488ff', weight: 4, opacity: 0.7, dashArray: '8 6',
        lineCap: 'round', lineJoin: 'round'
      }).addTo(map);`
    : '';

  // Green safest route (glowing)
  const safestGlow = safestRoute.length > 1
    ? `
      L.polyline(${JSON.stringify(safestRoute)}, {
        color: '#00ff88', weight: 10, opacity: 0.15
      }).addTo(map);
      L.polyline(${JSON.stringify(safestRoute)}, {
        color: '#00ff88', weight: 5, opacity: 0.8,
        lineCap: 'round', lineJoin: 'round'
      }).addTo(map);`
    : '';

  // AI Score badge overlay
  const scoreBadge = aiScore
    ? `
      var badge = L.control({position: 'topright'});
      badge.onAdd = function() {
        var div = L.DomUtil.create('div');
        div.innerHTML = '<div style="background:rgba(10,10,10,0.92);border:1px solid #333;border-radius:10px;padding:10px 14px;font-family:system-ui;min-width:160px;backdrop-filter:blur(8px)">' +
          '<div style="font-size:10px;color:#888;font-weight:600;letter-spacing:0.5px;margin-bottom:6px">🤖 AI SAFETY ANALYSIS</div>' +
          '<div style="display:flex;gap:12px;margin-bottom:6px">' +
            '<div style="text-align:center"><div style="font-size:18px;font-weight:800;color:#4488ff">${aiScore.fastest_route_score}</div><div style="font-size:9px;color:#666">Fastest</div></div>' +
            '<div style="text-align:center"><div style="font-size:18px;font-weight:800;color:#00ff88">${aiScore.safest_route_score}</div><div style="font-size:9px;color:#666">Safest</div></div>' +
          '</div>' +
          '<div style="font-size:9px;color:#555;border-top:1px solid #222;padding-top:4px">${aiScore.reasoning?.replace(/_/g, ' ')}</div>' +
        '</div>';
        return div;
      };
      badge.addTo(map);`
    : '';

  const html = `<!DOCTYPE html>
<html><head>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"/>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"><\/script>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  html,body,#map{width:100%;height:100%;background:#0a0a0a}
  .leaflet-tile-pane{filter:brightness(0.7) contrast(1.15) saturate(0.7)}
  .leaflet-popup-content-wrapper{background:#1a1a1a;color:#fff;border-radius:8px;border:1px solid #333;box-shadow:0 4px 20px rgba(0,0,0,0.5)}
  .leaflet-popup-tip{background:#1a1a1a}
  .leaflet-popup-close-button{color:#666!important}
  .leaflet-control-zoom a{background:#1a1a1a!important;color:#00ff88!important;border-color:#333!important}
  .leaflet-control-attribution{background:rgba(10,10,10,0.8)!important;color:#333!important;font-size:8px}
  .leaflet-control-attribution a{color:#444!important}
</style>
</head><body>
<div id="map"></div>
<script>
  var map = L.map('map',{center:[${center?.lat||23.0225},${center?.lng||72.5714}],zoom:${zoom},zoomControl:true});
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',{
    attribution:'© OSM © CARTO',maxZoom:19
  }).addTo(map);

  // User location
  L.circleMarker([${center?.lat||23.0225},${center?.lng||72.5714}],{
    radius:6,color:'#4488ff',fillColor:'#4488ff',fillOpacity:1,weight:2
  }).addTo(map).bindPopup('<div style="font-family:system-ui;color:#fff"><b>📍 You</b></div>');

  ${clusterCircles}
  ${threatMarkers}
  ${safeMarkers}
  ${fastestLine}
  ${safestGlow}
  ${scoreBadge}
<\/script>
</body></html>`;

  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        <iframe
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
  container: { flex: 1, backgroundColor: colors.bg },
  webview: { flex: 1, backgroundColor: colors.bg },
});

export default LeafletMap;
