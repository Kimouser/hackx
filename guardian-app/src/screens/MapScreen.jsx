/**
 * MapScreen.jsx  –  Project Guardian
 * Dynamic Location Filtering: Stats drop to 0 if no data is in the current region
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator, TouchableOpacity,
  ScrollView, Animated, Platform, TextInput, Keyboard
} from 'react-native';
import * as Location from 'expo-location';

import LeafletMap from '../components/LeafletMap';
import JourneySummaryPopup from '../components/JourneySummaryPopup';
import { getMapOverlay } from '../db/database';
import { AHMEDABAD } from '../utils/location';
import { summarizeJourney } from '../services/journeyAI';
import { PanicButton, useSOS, SOS_STATE } from '../modules/emergency';
import { ICON_COLORS, safeZoneIcon, THREAT_ICON, CURRENT_LOCATION_ICON } from '../modules/map/MapIcons';

const C = {
  bg: '#080810', panel: 'rgba(14,14,26,0.95)', panelBorder: '#1e1e35',
  surface: '#13131f', purple: '#7c4dff', purpleBright: '#a07dff',
  teal: '#06d6a0', tealDim: 'rgba(6,214,160,0.12)', threat: '#ff3c3c',
  text: '#e8e6f0', textSub: '#9895b0', textMuted: '#504d6a', border: '#1e1e35',
};

const TILE_URL = 'https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png';
const TILE_ATTRIBUTION = '&copy; Stadia Maps';

const SAFE_PATHS = [
  { coords: [ [23.0305, 72.5653], [23.0305, 72.5580], [23.0305, 72.5540], [23.0335, 72.5540], [23.0365, 72.5540], [23.0365, 72.5463] ] }
];

const INITIAL_JOURNEY = {
  title: 'Paldi to SG Highway Preview',
  start: 'Paldi Market', end: 'SG Highway', route: SAFE_PATHS[0].coords,
  segments: [ { street: 'Ashram Road', locality: 'Paldi', characteristics: 'busy stretch' } ]
};

function ScoreRing({ score }) { return (<View style={styles.ringOuter}><View style={styles.ringInner}><Text style={styles.scoreNum}>{score}</Text><Text style={styles.scoreLabel}>SAFE</Text></View></View>); }
function StatTile({ icon, value, label, accent }) { return (<View style={[styles.statTile, accent && styles.statTileAccent]}><Text style={styles.statIcon}>{icon}</Text><Text style={[styles.statValue, accent && { color: C.teal }]}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>); }
function LayerToggle({ label, icon, active, color, onPress }) { const dotColor = color ?? C.purple; return (<TouchableOpacity style={[styles.layerRow, active && { borderColor: dotColor, backgroundColor: `${dotColor}18` }]} onPress={onPress} activeOpacity={0.75}><Text style={styles.layerIcon}>{icon}</Text><Text style={[styles.layerLabel, active && { color: dotColor }]}>{label}</Text><View style={[styles.pill, active && { backgroundColor: dotColor }]}><View style={[styles.pillKnob, active && styles.pillKnobOn]} /></View></TouchableOpacity>); }

const MapScreen = () => {
  const [threats, setThreats] = useState([]);
  const [safeZones, setSafeZones] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [journeyLoading, setJourneyLoading] = useState(false);
  const [journeySummary, setJourneySummary] = useState(INITIAL_JOURNEY); 
  const [dynamicPaths, setDynamicPaths] = useState(SAFE_PATHS); 

  const [showPaths, setShowPaths] = useState(true);
  const [showThreats, setShowThreats] = useState(true);
  const [showSafeZones, setShowSafeZones] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  const sidebarAnim = useRef(new Animated.Value(1)).current;
  const { sosState } = useSOS();
  const isSOSActive = sosState !== SOS_STATE.IDLE;

  const [userLocation, setUserLocation] = useState({ lat: AHMEDABAD.latitude, lng: AHMEDABAD.longitude }); 
  const [mapCenter, setMapCenter] = useState({ lat: AHMEDABAD.latitude, lng: AHMEDABAD.longitude });
  const [userLocName, setUserLocName] = useState('Ahmedabad, GJ');
  const [isLocating, setIsLocating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const toggleSidebar = useCallback(() => {
    const next = sidebarOpen ? 0 : 1;
    Animated.spring(sidebarAnim, { toValue: next, tension: 80, friction: 12, useNativeDriver: true }).start();
    setSidebarOpen(p => !p);
  }, [sidebarOpen]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const overlay = await getMapOverlay();
      setThreats(overlay.threats);
      setSafeZones(overlay.safeZones);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }, []);

  const loadJourneySummary = async (journeyObj = INITIAL_JOURNEY) => {
    setJourneyLoading(true);
    try {
      const summary = await summarizeJourney(journeyObj);
      setJourneySummary(summary);
    } catch (error) { console.error(error); } finally { setJourneyLoading(false); }
  };

  useEffect(() => { loadData(); loadJourneySummary(); }, [loadData]);

  const handleLocateMe = async () => {
    setIsLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const lat = location.coords.latitude;
      const lng = location.coords.longitude;

      setUserLocation({ lat, lng });
      setMapCenter({ lat, lng });

      try {
        const geocode = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
        if (geocode && geocode.length > 0 && (geocode[0].city || geocode[0].region)) {
          setUserLocName(`${geocode[0].city || geocode[0].subregion || 'Unknown'}, ${geocode[0].region || ''}`);
          return;
        }
      } catch (expoErr) {
        console.log("Expo geocoding failed, trying web fallback...");
      }

      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      const data = await res.json();
      
      if (data && data.address) {
        const city = data.address.city || data.address.town || data.address.suburb || 'Unknown';
        const state = data.address.state || '';
        setUserLocName(`${city}, ${state}`);
      } else {
        setUserLocName('Current Location');
      }
    } catch (error) { 
      console.error(error); 
    } finally { 
      setIsLocating(false); 
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    Keyboard.dismiss();

    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      
      if (data && data.length > 0) {
        const destLat = parseFloat(data[0].lat);
        const destLng = parseFloat(data[0].lon);
        const destName = data[0].display_name.split(',')[0]; 

        const startLat = userLocation ? userLocation.lat : AHMEDABAD.latitude;
        const startLng = userLocation ? userLocation.lng : AHMEDABAD.longitude;

        setMapCenter({ lat: destLat, lng: destLng });
        setUserLocation({ lat: destLat, lng: destLng });
        setUserLocName(destName);

        const newPathCoords = [[startLat, startLng], [destLat, destLng]];
        setDynamicPaths([{ coords: newPathCoords }]);

        const newJourneyMock = {
          title: `Route to ${destName}`,
          start: 'Previous Location',
          end: destName,
          route: newPathCoords,
          segments: [{ street: 'AI Tracking Route...', locality: destName, characteristics: 'Analyzing dynamic path safety.' }]
        };
        
        loadJourneySummary(newJourneyMock);

      } else { alert('Location not found.'); }
    } catch (err) { console.error(err); } finally {
      setIsSearching(false);
      setSearchQuery(''); 
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color={C.purple} />
        <Text style={styles.loadingText}>Initialising safety grid…</Text>
      </View>
    );
  }

  const panelTranslate = sidebarAnim.interpolate({ inputRange: [0, 1], outputRange: [-220, 0] });

  // ─── NEW: DYNAMIC DATA FILTERING ───
  // Checks if the database points are within roughly ~30km of the current map center
  const isNearby = (lat, lng) => {
    const threshold = 0.3; // Approx 30km radius in degrees
    return Math.abs(lat - mapCenter.lat) < threshold && Math.abs(lng - mapCenter.lng) < threshold;
  };

  const activeSafeZones = safeZones.filter(z => isNearby(z.lat || z.latitude, z.lng || z.longitude));
  const activeThreats = threats.filter(t => isNearby(t.lat || t.latitude, t.lng || t.longitude));

  const hasLocalData = activeSafeZones.length > 0 || activeThreats.length > 0;

  // Determine dynamic stats
  const displayStats = hasLocalData 
    ? { safeScore: 82, nearbyUnits: 3, etaMinutes: 7 } 
    : { safeScore: 0, nearbyUnits: 0, etaMinutes: 0 };

  const mapSafeZones = showSafeZones ? activeSafeZones.map(zone => ({ ...zone, svgHtml: safeZoneIcon(zone.type, ICON_COLORS.safe) })) : [];
  let mapThreats = showThreats ? activeThreats.map(threat => ({ ...threat, svgHtml: THREAT_ICON(ICON_COLORS.threat) })) : [];
  
  if (userLocation) {
    mapThreats = [...mapThreats, { lat: userLocation.lat, lng: userLocation.lng, svgHtml: CURRENT_LOCATION_ICON() }];
  }

  return (
    <View style={styles.root}>

      <LeafletMap
        center={mapCenter}
        zoom={13}
        threats={mapThreats}
        safeZones={mapSafeZones}
        safePaths={showPaths ? dynamicPaths : []} 
        tileUrl={TILE_URL}
        tileAttribution={TILE_ATTRIBUTION}
        pathColor={ICON_COLORS.path}
      />

      {journeySummary && (
        <View style={styles.previewContainer}>
          <JourneySummaryPopup
            summary={journeySummary}
            loading={journeyLoading}
            onRefresh={() => loadJourneySummary(journeySummary)}
          />
        </View>
      )}

      {!isSOSActive && (
        <View style={styles.legendBar}>
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search destination..."
              placeholderTextColor={C.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
            />
            <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
              {isSearching ? <ActivityIndicator size="small" color="#fff" /> : <Text>🔍</Text>}
            </TouchableOpacity>
          </View>

          <View style={styles.legendItemGroup}>
            <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: C.teal }]} /><Text style={styles.legendLabel}>Safe Zones ({activeSafeZones.length})</Text></View>
            <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: C.threat }]} /><Text style={styles.legendLabel}>Threats ({activeThreats.length})</Text></View>
            <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: C.purple }]} /><Text style={styles.legendLabel}>Safe Paths</Text></View>
          </View>
        </View>
      )}

      {!isSOSActive && (
        <Animated.View style={[styles.sidebar, { transform: [{ translateX: panelTranslate }] }]}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.sidebarContent}>
            
            <TouchableOpacity style={styles.locRow} onPress={handleLocateMe} activeOpacity={0.7}>
              <View style={[styles.locDot, isLocating && { backgroundColor: C.teal, shadowColor: C.teal }]} />
              <View>
                <Text style={styles.locLabel}>MY LOCATION</Text>
                <Text style={styles.locName}>{userLocName}</Text>
              </View>
            </TouchableOpacity>

            <View style={styles.divider} />
            <View style={styles.scoreRow}>
              <ScoreRing score={displayStats.safeScore} />
              <View style={styles.statsGrid}>
                <StatTile icon="⚠️" value={activeThreats.length} label="THREATS" />
                <StatTile icon="🛡️" value={activeSafeZones.length} label="SAFE" accent />
                <StatTile icon="🚔" value={displayStats.nearbyUnits} label="UNITS" />
                <StatTile icon="⏱️" value={`${displayStats.etaMinutes}m`} label="ETA" />
              </View>
            </View>
            <View style={styles.divider} />
            <Text style={styles.sectionHead}>MAP LAYERS</Text>
            <LayerToggle label="Safe Paths" icon="🛤️" active={showPaths} color={C.purple} onPress={() => setShowPaths(p => !p)} />
            <LayerToggle label="Threat Zones" icon="🔴" active={showThreats} color={C.threat} onPress={() => setShowThreats(p => !p)} />
            <LayerToggle label="Safe Zones" icon="🟢" active={showSafeZones} color={C.teal} onPress={() => setShowSafeZones(p => !p)} />
          </ScrollView>
          <TouchableOpacity style={styles.refreshBtn} onPress={loadData} activeOpacity={0.75}>
            <Text style={styles.refreshIcon}>🔄</Text>
            <Text style={styles.refreshLabel}>Refresh Data</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {!isSOSActive && (
        <TouchableOpacity style={[styles.chevronWrap, sidebarOpen && { left: 220 }]} onPress={toggleSidebar}>
          <Text style={styles.chevron}>{sidebarOpen ? '‹' : '›'}</Text>
        </TouchableOpacity>
      )}

      {isSOSActive ? <View style={styles.sosOverlay}><PanicButton /></View> : <View style={styles.sosFloat}><PanicButton /></View>}
    </View>
  );
};

const SIDEBAR_W = 220;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  loadingWrap: { flex: 1, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center', gap: 14 },
  loadingText: { color: C.textSub, fontSize: 13, letterSpacing: 1 },
  
  legendBar: { position: 'absolute', top: 0, left: SIDEBAR_W, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, paddingHorizontal: 20, backgroundColor: 'rgba(14,14,26,0.95)', zIndex: 50, borderBottomWidth: 1, borderBottomColor: C.panelBorder },
  searchContainer: { width: 300, height: 36, flexDirection: 'row', backgroundColor: C.surface, borderRadius: 6, borderWidth: 1, borderColor: C.border },
  searchInput: { flex: 1, color: C.text, paddingHorizontal: 12, fontSize: 13, outlineStyle: 'none' },
  searchButton: { paddingHorizontal: 12, justifyContent: 'center', alignItems: 'center', borderLeftWidth: 1, borderColor: C.border },
  legendItemGroup: { flexDirection: 'row', alignItems: 'center', gap: 18 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendLabel: { color: C.textSub, fontSize: 11 },
  previewContainer: { position: 'absolute', top: 70, right: 20, zIndex: 100, maxHeight: '75%' },

  sidebar: { position: 'absolute', top: 0, bottom: 0, left: 0, width: SIDEBAR_W, backgroundColor: C.panel, borderRightWidth: 1, borderRightColor: C.panelBorder, zIndex: 100, ...Platform.select({ ios: {}, android: { elevation: 12 } }) },
  sidebarContent: { paddingTop: 48, paddingHorizontal: 14, paddingBottom: 8, gap: 14 },
  locRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  locDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: C.purple, shadowColor: C.purple, shadowRadius: 6, shadowOpacity: 0.9 },
  locLabel: { color: C.textMuted, fontSize: 9, letterSpacing: 2 },
  locName: { color: C.text, fontSize: 13, fontWeight: '700', marginTop: 2 },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  ringOuter: { width: 62, height: 62, borderRadius: 31, borderWidth: 4, borderColor: C.teal, justifyContent: 'center', alignItems: 'center', shadowColor: C.teal, shadowRadius: 8, shadowOpacity: 0.5 },
  ringInner: { alignItems: 'center' },
  scoreNum: { color: C.text, fontSize: 18, fontWeight: '800' },
  scoreLabel:{ color: C.textMuted, fontSize: 7, letterSpacing: 2 },
  statsGrid: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  statTile: { width: '47%', backgroundColor: C.surface, borderRadius: 8, borderWidth: 1, borderColor: C.border, padding: 7, alignItems: 'center', gap: 2 },
  statTileAccent: { borderColor: C.teal, backgroundColor: C.tealDim },
  statIcon: { fontSize: 13 },
  statValue: { color: C.text, fontSize: 14, fontWeight: '800' },
  statLabel: { color: C.textMuted, fontSize: 8, letterSpacing: 1 },
  divider: { height: 1, backgroundColor: C.border },
  sectionHead: { color: C.textMuted, fontSize: 9, letterSpacing: 2 },
  layerRow: { flexDirection: 'row', alignItems: 'center', gap: 9, backgroundColor: C.surface, borderRadius: 10, borderWidth: 1, borderColor: C.border, paddingVertical: 9, paddingHorizontal: 10 },
  layerIcon: { fontSize: 13 },
  layerLabel: { flex: 1, color: C.textSub, fontSize: 11, fontWeight: '600' },
  pill: { width: 30, height: 17, borderRadius: 9, backgroundColor: C.panelBorder, padding: 2, flexDirection: 'row', alignItems: 'center' },
  pillKnob: { width: 13, height: 13, borderRadius: 7, backgroundColor: C.textMuted },
  pillKnobOn: { backgroundColor: '#fff', marginLeft: 'auto' },
  refreshBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, margin: 14, paddingVertical: 10, backgroundColor: C.surface, borderRadius: 10, borderWidth: 1, borderColor: C.border },
  refreshIcon: { fontSize: 13 },
  refreshLabel: { color: C.textSub, fontSize: 12, fontWeight: '600' },
  chevronWrap: { position: 'absolute', top: '50%', left: SIDEBAR_W, marginTop: -24, width: 22, height: 48, backgroundColor: C.panel, borderTopRightRadius: 8, borderBottomRightRadius: 8, borderWidth: 1, borderLeftWidth: 0, borderColor: C.panelBorder, justifyContent: 'center', alignItems: 'center', zIndex: 110 },
  chevron: { color: C.purpleBright, fontSize: 16 },
  sosFloat: { position: 'absolute', bottom: 0, right: 0, zIndex: 999, transform: [{ scale: 0.75 }] },
  sosOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(8,8,16,0.97)', zIndex: 9999, justifyContent: 'center', alignItems: 'center' },
});

export default MapScreen;