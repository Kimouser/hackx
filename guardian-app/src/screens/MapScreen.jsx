/**
 * MapScreen.jsx — AI-Powered Safe-Passage Navigation
 *
 * Full-screen immersive map with floating glassmorphism overlays.
 * Mobile: react-native-maps (Google provider, custom dark theme)
 * Web:    LeafletJS dark basemap (CARTO dark_all tiles)
 *
 * Features:
 * - Floating search bar with autocomplete
 * - Dual-route: Blue (fastest) vs Neon Green (AI safest)
 * - K-Means threat clusters + animated safe zone markers
 * - Live AI Safety Score overlay
 * - Sponsored "Safe Haven" billboard markers
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator, TextInput,
  Platform, Keyboard, Dimensions, TouchableOpacity, Animated,
} from 'react-native';

import colors from '../theme/colors';
import PanicButton from '../components/PanicButton';
import { getMapOverlay } from '../db/database';
import { MUMBAI, getCurrentLocation } from '../utils/location';
import { compareRoutes, kMeansClusters } from '../services/safetyInferenceEngine';
import { appendToTechnicalLog } from '../services/technicalLog';

const { width, height } = Dimensions.get('window');
const ASPECT_RATIO = width / height;

const GOOGLE_MAPS_APIKEY = 'YOUR_GOOGLE_MAPS_API_KEY';

// ─── Google Maps Dark Theme ───
const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#1a1a2e' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#6c6c8a' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#1a1a2e' }] },
  { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#2a2a4a' }] },
  { featureType: 'administrative.country', elementType: 'labels.text.fill', stylers: [{ color: '#8a8aaa' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#a0a0c0' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#5a5a7a' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#151528' }] },
  { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#3a3a5a' }] },
  { featureType: 'road', elementType: 'geometry.fill', stylers: [{ color: '#232340' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#6a6a8a' }] },
  { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#2a2a48' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#2f2f50' }] },
  { featureType: 'road.highway.controlled_access', elementType: 'geometry', stylers: [{ color: '#353560' }] },
  { featureType: 'transit', elementType: 'labels.text.fill', stylers: [{ color: '#5a5a7a' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0d0d1a' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#2a2a4a' }] },
];

// ─── Demo Routes (Mumbai landmarks) ───
const DEMO_ROUTES = {
  bandra: {
    label: 'Bandra Kurla Complex',
    fastest: [
      [19.0760, 72.8777], [19.0720, 72.8730], [19.0700, 72.8690],
      [19.0680, 72.8670], [19.0667, 72.8645],
    ],
    safest: [
      [19.0760, 72.8777], [19.0730, 72.8750], [19.0700, 72.8720],
      [19.0660, 72.8640], [19.0600, 72.8550], [19.0553, 72.8340],
      [19.0515, 72.8286], [19.0553, 72.8340], [19.0620, 72.8500],
      [19.0660, 72.8640], [19.0667, 72.8645],
    ],
  },
  andheri: {
    label: 'Andheri Station',
    fastest: [
      [19.0760, 72.8777], [19.0850, 72.8700], [19.0950, 72.8600],
      [19.1100, 72.8500], [19.1197, 72.8464],
    ],
    safest: [
      [19.0760, 72.8777], [19.0730, 72.8750], [19.0660, 72.8640],
      [19.0553, 72.8340], [19.0515, 72.8286], [19.0700, 72.8350],
      [19.0900, 72.8380], [19.1170, 72.8400], [19.1197, 72.8464],
    ],
  },
  juhu: {
    label: 'Juhu Beach',
    fastest: [
      [19.0760, 72.8777], [19.0850, 72.8650], [19.0950, 72.8450],
      [19.1000, 72.8350], [19.1030, 72.8258],
    ],
    safest: [
      [19.0760, 72.8777], [19.0730, 72.8750], [19.0660, 72.8640],
      [19.0553, 72.8340], [19.0515, 72.8286], [19.0600, 72.8300],
      [19.0800, 72.8280], [19.0950, 72.8270], [19.1030, 72.8258],
    ],
  },
  dadar: {
    label: 'Dadar Market',
    fastest: [
      [19.0760, 72.8777], [19.0600, 72.8700], [19.0400, 72.8600],
      [19.0250, 72.8450], [19.0195, 72.8425],
    ],
    safest: [
      [19.0760, 72.8777], [19.0700, 72.8700], [19.0600, 72.8600],
      [19.0500, 72.8500], [19.0041, 72.8407], [19.0100, 72.8420],
      [19.0195, 72.8425],
    ],
  },
  marine: {
    label: 'Marine Drive',
    fastest: [
      [19.0760, 72.8777], [19.0600, 72.8650], [19.0400, 72.8500],
      [19.0100, 72.8300], [18.9554, 72.8146],
    ],
    safest: [
      [19.0760, 72.8777], [19.0700, 72.8700], [19.0553, 72.8340],
      [19.0041, 72.8407], [19.0069, 72.8159], [18.9700, 72.8150],
      [18.9554, 72.8146],
    ],
  },
};

// ─── Sponsored Safe Havens ───
const SPONSORS = [
  { name: 'Lilavati Hospital', tag: 'Safe Haven Partner', tier: 'gold', icon: '🏥' },
  { name: 'Bandra Police Station', tag: 'Guardian Verified', tier: 'platinum', icon: '👮' },
  { name: 'KEM Hospital Emergency', tag: 'Emergency Partner', tier: 'gold', icon: '🏥' },
  { name: 'Starbucks BKC (24/7)', tag: 'Safe Space Sponsor', tier: 'silver', icon: '☕' },
  { name: 'Apollo Pharmacy - Andheri', tag: 'Night Safety Partner', tier: 'silver', icon: '💊' },
];

// ═══════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════
const MapScreen = () => {
  const [threats, setThreats] = useState([]);
  const [safeZones, setSafeZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [userLocation, setUserLocation] = useState(MUMBAI);

  const [activeRoute, setActiveRoute] = useState(null);
  const [aiScore, setAiScore] = useState(null);
  const [threatClusters, setThreatClusters] = useState([]);

  const mapRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const overlay = await getMapOverlay();
      setThreats(overlay.threats);
      setSafeZones(overlay.safeZones);

      const pts = overlay.threats.map((t) => [t.latitude, t.longitude]);
      const clusters = kMeansClusters(pts, Math.min(3, pts.length));
      setThreatClusters(clusters);

      const loc = await getCurrentLocation();
      setUserLocation(loc);
    } catch (error) {
      console.error('Map load error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Animate route info bar in
  useEffect(() => {
    if (aiScore) {
      Animated.spring(fadeAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }).start();
    } else {
      fadeAnim.setValue(0);
    }
  }, [aiScore]);

  // ─── Search Handler ───
  const handleSearch = () => {
    if (!searchText.trim()) return;
    const q = searchText.toLowerCase().trim();

    const matchKey = Object.keys(DEMO_ROUTES).find((k) =>
      q.includes(k) || DEMO_ROUTES[k].label.toLowerCase().includes(q)
    );

    runRoute(matchKey || Object.keys(DEMO_ROUTES)[0]);
    Keyboard.dismiss();
  };

  const runRoute = (routeKey) => {
    const route = DEMO_ROUTES[routeKey];
    setActiveRoute({ key: routeKey, ...route });

    const result = compareRoutes(route.fastest, route.safest, threats, safeZones);
    setAiScore(result);

    appendToTechnicalLog({
      event: 'route_comparison',
      destination: route.label,
      result,
      timestamp: new Date().toISOString(),
    });

    if (mapRef.current && Platform.OS !== 'web') {
      const allCoords = [...route.fastest, ...route.safest].map(([lat, lng]) => ({
        latitude: lat, longitude: lng,
      }));
      mapRef.current.fitToCoordinates(allCoords, {
        edgePadding: { top: 180, right: 60, bottom: 100, left: 60 },
        animated: true,
      });
    }
  };

  const clearRoute = () => {
    setActiveRoute(null);
    setAiScore(null);
    setSearchText('');
    fadeAnim.setValue(0);
  };

  // ─── Suggestion pills (quick search) ───
  const suggestions = Object.entries(DEMO_ROUTES).map(([key, val]) => ({
    key,
    label: val.label.split(' ')[0], // first word
  }));

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.safe} />
        <Text style={styles.loadingText}>Initializing Guardian AI...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* ═══ THE MAP ═══ */}
      {Platform.OS === 'web' ? (
        <WebMap
          threats={threats}
          safeZones={safeZones}
          userLocation={userLocation}
          activeRoute={activeRoute}
          aiScore={aiScore}
          threatClusters={threatClusters}
        />
      ) : (
        <NativeMap
          mapRef={mapRef}
          threats={threats}
          safeZones={safeZones}
          userLocation={userLocation}
          activeRoute={activeRoute}
          aiScore={aiScore}
          threatClusters={threatClusters}
        />
      )}

      {/* ═══ FLOATING SEARCH BAR ═══ */}
      <View style={[styles.searchWrap, searchFocused && styles.searchWrapFocused]}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search destination..."
            placeholderTextColor="rgba(255,255,255,0.35)"
            value={searchText}
            onChangeText={setSearchText}
            onSubmitEditing={handleSearch}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            returnKeyType="search"
          />
          {searchText ? (
            <TouchableOpacity onPress={clearRoute} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={styles.clearX}>✕</Text>
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity style={styles.goBtn} onPress={handleSearch}>
            <Text style={styles.goBtnText}>GO</Text>
          </TouchableOpacity>
        </View>

        {/* Quick suggestions */}
        {!activeRoute && (
          <View style={styles.suggestRow}>
            {suggestions.map((s) => (
              <TouchableOpacity
                key={s.key}
                style={styles.suggestPill}
                onPress={() => { setSearchText(s.label); runRoute(s.key); }}
              >
                <Text style={styles.suggestText}>{s.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* ═══ AI ROUTE INFO PANEL ═══ */}
      {activeRoute && aiScore && (
        <Animated.View style={[styles.routePanel, {
          opacity: fadeAnim,
          transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }],
        }]}>
          <View style={styles.routeHeader}>
            <View style={styles.routeDestRow}>
              <Text style={styles.routeArrow}>→</Text>
              <Text style={styles.routeDest}>{activeRoute.label}</Text>
            </View>
            <TouchableOpacity onPress={clearRoute}>
              <Text style={styles.routeClose}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.routeDivider} />

          <View style={styles.scoreRow}>
            {/* Fastest */}
            <View style={styles.scoreCard}>
              <View style={[styles.scoreIndicator, { backgroundColor: '#4488ff' }]} />
              <View>
                <Text style={styles.scoreLabel}>Fastest</Text>
                <Text style={[styles.scoreValue, { color: '#4488ff' }]}>
                  {aiScore.fastest_route_score}
                </Text>
              </View>
            </View>

            {/* VS */}
            <View style={styles.vsCircle}>
              <Text style={styles.vsText}>VS</Text>
            </View>

            {/* Safest */}
            <View style={styles.scoreCard}>
              <View style={[styles.scoreIndicator, { backgroundColor: colors.safe }]} />
              <View>
                <Text style={styles.scoreLabel}>AI Safest</Text>
                <Text style={[styles.scoreValue, { color: colors.safe }]}>
                  {aiScore.safest_route_score}
                </Text>
              </View>
            </View>
          </View>

          {/* Improvement badge */}
          <View style={styles.improveBadge}>
            <Text style={styles.improveIcon}>🛡️</Text>
            <Text style={styles.improveText}>
              {aiScore.score_improvement} safer via AI route
            </Text>
          </View>
        </Animated.View>
      )}

      {/* ═══ MAP LEGEND ═══ */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.safe }]} />
          <Text style={styles.legendLabel}>Safe Zones</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.threat }]} />
          <Text style={styles.legendLabel}>Threats</Text>
        </View>
        {activeRoute && (
          <>
            <View style={styles.legendItem}>
              <View style={[styles.legendLine, { backgroundColor: '#4488ff' }]} />
              <Text style={styles.legendLabel}>Fast</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendLine, { backgroundColor: colors.safe }]} />
              <Text style={styles.legendLabel}>Safe</Text>
            </View>
          </>
        )}
      </View>

      {/* ═══ SOS BUTTON ═══ */}
      <PanicButton />
    </View>
  );
};

// ═══════════════════════════════════════════════════
// NATIVE MAP (react-native-maps with Google provider)
// ═══════════════════════════════════════════════════
const NativeMap = ({
  mapRef, threats, safeZones, userLocation,
  activeRoute, aiScore, threatClusters,
}) => {
  const MapView = require('react-native-maps').default;
  const { Marker, Circle, Polyline, Callout, PROVIDER_GOOGLE } = require('react-native-maps');

  const sevColor = {
    low: '#22cc66', medium: '#ffaa00', high: '#ff6600', critical: '#ff2244',
  };

  return (
    <MapView
      ref={mapRef}
      style={StyleSheet.absoluteFillObject}
      provider={PROVIDER_GOOGLE}
      customMapStyle={darkMapStyle}
      initialRegion={{
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.07,
        longitudeDelta: 0.07 * ASPECT_RATIO,
      }}
      showsUserLocation
      showsMyLocationButton={false}
      showsCompass={false}
      mapPadding={{ top: 0, right: 0, bottom: 70, left: 0 }}
    >
      {/* K-Means cluster rings */}
      {threatClusters.map((c, i) => (
        <Circle
          key={`cl-${i}`}
          center={{ latitude: c.center.lat, longitude: c.center.lng }}
          radius={c.radius}
          strokeColor="rgba(255,100,20,0.5)"
          strokeWidth={2}
          fillColor="rgba(255,60,0,0.08)"
        />
      ))}

      {/* Threat zones */}
      {threats.map((t, i) => (
        <React.Fragment key={`t-${i}`}>
          <Circle
            center={{ latitude: t.latitude, longitude: t.longitude }}
            radius={120 + t.upvotes * 6}
            strokeColor={(sevColor[t.severity] || '#ff2244') + '60'}
            fillColor={(sevColor[t.severity] || '#ff2244') + '18'}
            strokeWidth={1}
          />
          <Marker
            coordinate={{ latitude: t.latitude, longitude: t.longitude }}
            title={t.title}
            description={`${t.severity.toUpperCase()} · ${t.upvotes} upvotes`}
            pinColor={sevColor[t.severity] || '#ff2244'}
          />
        </React.Fragment>
      ))}

      {/* Safe zone markers with billboard callouts */}
      {safeZones.map((z, i) => {
        const sp = SPONSORS.find((s) => s.name === z.name);
        return (
          <Marker
            key={`s-${i}`}
            coordinate={{ latitude: z.latitude, longitude: z.longitude }}
            title={z.name}
            description={sp ? sp.tag : z.category}
            pinColor={colors.safe}
          >
            {sp && (
              <Callout tooltip>
                <View style={styles.billboard}>
                  <Text style={{ fontSize: 24 }}>{sp.icon}</Text>
                  <Text style={styles.bbName}>{z.name}</Text>
                  <View style={[styles.bbBadge,
                    sp.tier === 'platinum' ? styles.bbPlatinum :
                    sp.tier === 'gold' ? styles.bbGold : styles.bbSilver
                  ]}>
                    <Text style={styles.bbTag}>{sp.tag}</Text>
                  </View>
                </View>
              </Callout>
            )}
          </Marker>
        );
      })}

      {/* Dual routes */}
      {activeRoute && (
        <>
          <Polyline
            coordinates={activeRoute.fastest.map(([lat, lng]) => ({ latitude: lat, longitude: lng }))}
            strokeColor="#4488ff"
            strokeWidth={4}
            lineDashPattern={[12, 6]}
          />
          <Polyline
            coordinates={activeRoute.safest.map(([lat, lng]) => ({ latitude: lat, longitude: lng }))}
            strokeColor="rgba(0,255,136,0.2)"
            strokeWidth={14}
          />
          <Polyline
            coordinates={activeRoute.safest.map(([lat, lng]) => ({ latitude: lat, longitude: lng }))}
            strokeColor={colors.safe}
            strokeWidth={5}
          />
          <Marker
            coordinate={{
              latitude: activeRoute.safest[activeRoute.safest.length - 1][0],
              longitude: activeRoute.safest[activeRoute.safest.length - 1][1],
            }}
            title={activeRoute.label}
            pinColor={colors.safe}
          />
        </>
      )}
    </MapView>
  );
};

// ═══════════════════════════════════════════════════
// WEB MAP (LeafletJS — polished dark basemap)
// ═══════════════════════════════════════════════════
const WebMap = ({
  threats, safeZones, userLocation,
  activeRoute, aiScore, threatClusters,
}) => {
  const categoryIcons = {
    hospital: '🏥', police_station: '👮', pharmacy: '💊',
    '24x7_hotspot': '☕', fire_station: '🚒',
  };
  const sevColors = {
    low: '#22cc66', medium: '#ffaa00', high: '#ff6600', critical: '#ff2244',
  };

  const safeMkrs = safeZones.map((z) => {
    const ic = categoryIcons[z.category] || '🛡️';
    const sp = SPONSORS.find((s) => s.name === z.name);
    const popup = sp
      ? `<div style="text-align:center"><b style="color:#00ff88;font-size:13px">${z.name}</b><br><span style="color:#aaa;font-size:10px">${sp.tag}</span><br><span style="background:rgba(0,255,136,0.15);color:#00ff88;padding:2px 8px;border-radius:4px;font-size:9px;font-weight:600">${sp.tier.toUpperCase()}</span></div>`
      : `<b style="color:#00ff88">${z.name}</b><br><span style="color:#aaa">${z.category}</span>`;
    return `L.marker([${z.latitude},${z.longitude}],{icon:L.divIcon({className:'',html:'<div style="font-size:20px;text-align:center;filter:drop-shadow(0 0 6px rgba(0,255,136,0.6));width:32px;height:32px;line-height:32px;background:rgba(0,255,136,0.1);border-radius:50%;border:1px solid rgba(0,255,136,0.3)">${ic}</div>',iconSize:[32,32],iconAnchor:[16,16]})}).addTo(map).bindPopup('${popup.replace(/'/g, "\\'")}');`;
  }).join('\n');

  const threatMkrs = threats.map((t) => {
    const c = sevColors[t.severity] || '#ff2244';
    const r = 120 + t.upvotes * 6;
    return `L.circle([${t.latitude},${t.longitude}],{radius:${r},color:'${c}',fillColor:'${c}',fillOpacity:0.15,weight:1.5}).addTo(map).bindPopup('<b style="color:${c}">${t.title}</b><br><span style="color:#aaa">${t.severity.toUpperCase()} · ${t.upvotes} upvotes</span>');`;
  }).join('\n');

  const clusterMkrs = threatClusters.map((c) =>
    `L.circle([${c.center.lat},${c.center.lng}],{radius:${c.radius},color:'rgba(255,100,20,0.5)',fillColor:'rgba(255,60,0,0.06)',weight:2,dashArray:'8 5'}).addTo(map);`
  ).join('\n');

  let routeJS = '';
  if (activeRoute) {
    const fc = activeRoute.fastest.map(([a, b]) => `[${a},${b}]`).join(',');
    const sc = activeRoute.safest.map(([a, b]) => `[${a},${b}]`).join(',');
    const dest = activeRoute.safest[activeRoute.safest.length - 1];
    routeJS = `
      L.polyline([${fc}],{color:'#4488ff',weight:4,dashArray:'12 6',opacity:0.8}).addTo(map);
      L.polyline([${sc}],{color:'rgba(0,255,136,0.15)',weight:14}).addTo(map);
      L.polyline([${sc}],{color:'#00ff88',weight:4}).addTo(map);
      L.marker([${dest[0]},${dest[1]}],{icon:L.divIcon({className:'',html:'<div style="width:14px;height:14px;background:#00ff88;border-radius:50%;border:3px solid #fff;box-shadow:0 0 12px rgba(0,255,136,0.6)"></div>',iconSize:[14,14],iconAnchor:[7,7]})}).addTo(map);
      map.fitBounds(L.latLngBounds([${fc},${sc}]),{padding:[50,40],maxZoom:14});
    `;
  }

  let scoreBadgeJS = '';
  if (aiScore) {
    scoreBadgeJS = `
      var b=L.control({position:'topright'});
      b.onAdd=function(){
        var d=L.DomUtil.create('div');
        d.style.cssText='background:rgba(10,10,20,0.92);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);padding:12px 16px;border-radius:14px;border:1px solid rgba(255,255,255,0.08);color:#fff;font-family:system-ui;margin-top:10px;margin-right:6px;';
        d.innerHTML='<div style="font-size:9px;color:rgba(255,255,255,0.4);letter-spacing:1.5px;font-weight:600;margin-bottom:6px">AI SAFETY ANALYSIS</div><div style="display:flex;gap:14px;align-items:baseline"><div style="text-align:center"><div style="font-size:22px;font-weight:800;color:#4488ff">${aiScore.fastest_route_score}</div><div style="font-size:9px;color:rgba(255,255,255,0.3);margin-top:2px">FAST</div></div><div style="font-size:10px;color:rgba(255,255,255,0.15);font-weight:700">VS</div><div style="text-align:center"><div style="font-size:22px;font-weight:800;color:#00ff88">${aiScore.safest_route_score}</div><div style="font-size:9px;color:rgba(255,255,255,0.3);margin-top:2px">SAFE</div></div></div>';
        return d;
      };
      b.addTo(map);
    `;
  }

  const html = `<!DOCTYPE html>
<html><head>
<meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"><\/script>
<style>
  html,body,#map{margin:0;padding:0;width:100%;height:100%;background:#0d0d1a;overflow:hidden}
  .leaflet-control-zoom a{background:rgba(10,10,20,0.85)!important;color:#888!important;border:1px solid rgba(255,255,255,0.08)!important;backdrop-filter:blur(8px)}
  .leaflet-control-zoom a:hover{background:rgba(20,20,40,0.95)!important;color:#fff!important}
  .leaflet-popup-content-wrapper{background:rgba(15,15,25,0.95)!important;border:1px solid rgba(255,255,255,0.1)!important;border-radius:12px!important;backdrop-filter:blur(12px);color:#eee!important;box-shadow:0 8px 32px rgba(0,0,0,0.4)!important}
  .leaflet-popup-tip{background:rgba(15,15,25,0.95)!important}
  .leaflet-control-attribution{display:none!important}
  @keyframes pulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.4);opacity:0.6}}
</style>
</head><body>
<div id="map"></div>
<script>
var map=L.map('map',{zoomControl:true,attributionControl:false}).setView([${userLocation.latitude},${userLocation.longitude}],13);
L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',{
  subdomains:'abcd',maxZoom:19
}).addTo(map);
// User location marker
L.marker([${userLocation.latitude},${userLocation.longitude}],{icon:L.divIcon({className:'',html:'<div style="position:relative"><div style="width:14px;height:14px;background:#4488ff;border-radius:50%;border:3px solid #fff;box-shadow:0 0 12px rgba(68,136,255,0.6)"></div><div style="position:absolute;top:-3px;left:-3px;width:20px;height:20px;border-radius:50%;border:2px solid rgba(68,136,255,0.4);animation:pulse 2s ease-in-out infinite"></div></div>',iconSize:[20,20],iconAnchor:[10,10]})}).addTo(map).bindPopup('<b style="color:#4488ff">Your Location</b>');
${safeMkrs}
${threatMkrs}
${clusterMkrs}
${routeJS}
${scoreBadgeJS}
<\/script></body></html>`;

  return (
    <iframe
      title="Guardian Map"
      srcDoc={html}
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, border: 'none' }}
    />
  );
};

// ═══════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d0d1a' },
  loadingContainer: {
    flex: 1, backgroundColor: '#0d0d1a',
    justifyContent: 'center', alignItems: 'center', gap: 16,
  },
  loadingText: { color: 'rgba(255,255,255,0.4)', fontSize: 14, letterSpacing: 0.5 },

  // ─── Search ───
  searchWrap: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 56 : Platform.OS === 'android' ? 40 : 16,
    left: 16, right: 16,
    zIndex: 100,
  },
  searchWrapFocused: {
    // subtle expand on focus
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(12,12,24,0.88)',
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 50,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12 },
      android: { elevation: 8 },
      web: { boxShadow: '0 4px 24px rgba(0,0,0,0.4)', backdropFilter: 'blur(16px)' },
    }),
  },
  searchIcon: { fontSize: 15, marginRight: 10, opacity: 0.6 },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
    height: '100%',
  },
  clearX: { color: 'rgba(255,255,255,0.3)', fontSize: 16, padding: 4 },
  goBtn: {
    backgroundColor: colors.safe,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 10,
    marginLeft: 10,
  },
  goBtnText: { color: '#000', fontWeight: '800', fontSize: 13, letterSpacing: 1 },

  suggestRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    paddingHorizontal: 2,
  },
  suggestPill: {
    backgroundColor: 'rgba(12,12,24,0.75)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    ...Platform.select({
      web: { backdropFilter: 'blur(8px)' },
    }),
  },
  suggestText: { color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: '600' },

  // ─── Route Panel ───
  routePanel: {
    position: 'absolute',
    bottom: Platform.OS === 'web' ? 80 : 90,
    left: 16, right: 16,
    backgroundColor: 'rgba(12,12,24,0.92)',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    zIndex: 99,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.3, shadowRadius: 16 },
      android: { elevation: 12 },
      web: { boxShadow: '0 -4px 32px rgba(0,0,0,0.4)', backdropFilter: 'blur(20px)' },
    }),
  },
  routeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  routeDestRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  routeArrow: { color: colors.safe, fontSize: 16, fontWeight: '700' },
  routeDest: { color: '#fff', fontSize: 16, fontWeight: '700' },
  routeClose: { color: 'rgba(255,255,255,0.25)', fontSize: 18, padding: 4 },
  routeDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginVertical: 14,
  },

  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  scoreCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    padding: 12,
  },
  scoreIndicator: {
    width: 4, height: 32, borderRadius: 2,
  },
  scoreLabel: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 11, fontWeight: '600',
    letterSpacing: 0.5,
  },
  scoreValue: {
    fontSize: 24, fontWeight: '800',
    marginTop: 2,
  },
  vsCircle: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.04)',
    justifyContent: 'center', alignItems: 'center',
    marginHorizontal: 10,
  },
  vsText: { color: 'rgba(255,255,255,0.2)', fontSize: 10, fontWeight: '800' },

  improveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
    backgroundColor: 'rgba(0,255,136,0.06)',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,255,136,0.1)',
  },
  improveIcon: { fontSize: 14 },
  improveText: { color: colors.safe, fontSize: 12, fontWeight: '600' },

  // ─── Legend ───
  legend: {
    position: 'absolute',
    bottom: Platform.OS === 'web' ? 72 : 82,
    left: 16,
    flexDirection: 'row',
    gap: 12,
    backgroundColor: 'rgba(12,12,24,0.8)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    zIndex: 50,
    ...Platform.select({
      web: { backdropFilter: 'blur(8px)' },
    }),
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 7, height: 7, borderRadius: 4 },
  legendLine: { width: 14, height: 3, borderRadius: 2 },
  legendLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: '600' },

  // ─── Billboards (native) ───
  billboard: {
    backgroundColor: 'rgba(12,12,24,0.95)',
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    minWidth: 170,
  },
  bbName: { color: '#fff', fontWeight: '700', fontSize: 13, textAlign: 'center', marginTop: 6, marginBottom: 8 },
  bbBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8 },
  bbPlatinum: { backgroundColor: 'rgba(180,180,255,0.12)', borderWidth: 1, borderColor: 'rgba(180,180,255,0.2)' },
  bbGold: { backgroundColor: 'rgba(255,200,0,0.1)', borderWidth: 1, borderColor: 'rgba(255,200,0,0.2)' },
  bbSilver: { backgroundColor: 'rgba(180,180,180,0.08)', borderWidth: 1, borderColor: 'rgba(180,180,180,0.15)' },
  bbTag: { color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: '600' },
});

export default MapScreen;
