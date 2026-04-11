/**
 * MapScreen.jsx  –  Project Guardian
 * Features: Autocomplete Search, Dynamic Stats, Tactical Glossary Legend, New Icons
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

// ─── NEW: LEGEND ROW HELPER ───
const LegendRow = ({ icon, label, sub }) => (
  <View style={styles.legendItem}>
    <View 
      style={styles.legendIconContainer} 
      {...(Platform.OS === 'web' ? { dangerouslySetInnerHTML: { __html: icon } } : {})} 
    />
    <View>
      <Text style={styles.legendLabel}>{label}</Text>
      {sub && <Text style={styles.legendSubLabel}>{sub}</Text>}
    </View>
  </View>
);

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
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showLegend, setShowLegend] = useState(false); 
  const debounceTimeout = useRef(null);

  const toggleSidebar = useCallback(() => {
    const next = sidebarOpen ? 0 : 1;
    Animated.spring(sidebarAnim, { toValue: next, tension: 80, friction: 12, useNativeDriver: true }).start();
    setSidebarOpen(p => !p);
  }, [sidebarOpen]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const overlay = await getMapOverlay();
      setThreats(overlay.threats || []);
      setSafeZones(overlay.safeZones || []);
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
      } catch (expoErr) { console.log("Geocoding fallback..."); }
    } catch (error) { console.error(error); } finally { setIsLocating(false); }
  };

  const handleSearchInputChange = (text) => {
    setSearchQuery(text);
    if (text.length < 3) { setSuggestions([]); setShowSuggestions(false); return; }
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    debounceTimeout.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(text)}&limit=5&addressdetails=1`);
        const data = await res.json();
        setSuggestions(data || []);
        setShowSuggestions(true);
      } catch (err) { console.error(err); } finally { setIsSearching(false); }
    }, 500);
  };

  const handleSelectSuggestion = (item) => {
    Keyboard.dismiss();
    setShowSuggestions(false);
    const destName = item.display_name.split(',')[0]; 
    setSearchQuery(destName); 
    const destLat = parseFloat(item.lat);
    const destLng = parseFloat(item.lon);
    setMapCenter({ lat: destLat, lng: destLng });
    setUserLocation({ lat: destLat, lng: destLng });
    const newPathCoords = [[userLocation.lat, userLocation.lng], [destLat, destLng]];
    setDynamicPaths([{ coords: newPathCoords }]);
    loadJourneySummary({ title: `Route to ${destName}`, route: newPathCoords });
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

  const isNearby = (lat, lng) => {
    const threshold = 0.3; 
    return Math.abs(lat - mapCenter.lat) < threshold && Math.abs(lng - mapCenter.lng) < threshold;
  };

  const activeSafeZones = safeZones.filter(z => isNearby(z.lat || z.latitude, z.lng || z.longitude));
  const activeThreats = threats.filter(t => isNearby(t.lat || t.latitude, t.lng || t.longitude));

  const mapSafeZones = showSafeZones ? activeSafeZones.map(zone => ({ ...zone, svgHtml: safeZoneIcon(zone.type, ICON_COLORS.safe) })) : [];
  let mapThreats = showThreats ? activeThreats.map(threat => ({ ...threat, svgHtml: THREAT_ICON(ICON_COLORS.threat) })) : [];
  if (userLocation) mapThreats = [...mapThreats, { lat: userLocation.lat, lng: userLocation.lng, svgHtml: CURRENT_LOCATION_ICON() }];

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
          <JourneySummaryPopup summary={journeySummary} loading={journeyLoading} />
        </View>
      )}

      {!isSOSActive && (
        <View style={styles.legendBar}>
          <View style={styles.searchWrapper}>
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search destination..."
                placeholderTextColor={C.textMuted}
                value={searchQuery}
                onChangeText={handleSearchInputChange} 
              />
              <View style={styles.searchButton}>
                {isSearching ? <ActivityIndicator size="small" color={C.purpleBright} /> : <Text>🔍</Text>}
              </View>
            </View>
            {showSuggestions && (
              <View style={styles.suggestionsDropdown}>
                {suggestions.map((item, index) => (
                  <TouchableOpacity key={index} style={styles.suggestionItem} onPress={() => handleSelectSuggestion(item)}>
                    <Text style={styles.suggestionTitle}>{item.display_name.split(',')[0]}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* ── UPDATED: Detailed Legend Dropdown ── */}
          <View style={styles.legendWrapper}>
            <TouchableOpacity style={styles.legendTrigger} onPress={() => setShowLegend(!showLegend)}>
              <Text style={styles.legendTriggerText}>Map Legend {showLegend ? '▲' : '▼'}</Text>
            </TouchableOpacity>

            {showLegend && (
              <View style={styles.legendDropdown}>
                <Text style={styles.legendSectionHead}>SAFE LANDMARKS ({activeSafeZones.length})</Text>
                <View style={styles.legendGrid}>
                  <LegendRow icon={safeZoneIcon('hospital')} label="Hospital / ER" />
                  <LegendRow icon={safeZoneIcon('police')} label="Police Station" />
                  <LegendRow icon={safeZoneIcon('fire')} label="Fire Brigade" />
                  <LegendRow icon={safeZoneIcon('pharmacy')} label="24/7 Pharmacy" />
                  <LegendRow icon={safeZoneIcon('railway')} label="Transport Hub" />
                  <LegendRow icon={safeZoneIcon('market')} label="Public Market" />
                  <LegendRow icon={safeZoneIcon('home')} label="Safe House" />
                </View>

                <View style={styles.legendDivider} />
                <Text style={styles.legendSectionHead}>HAZARDS ({activeThreats.length})</Text>
                <LegendRow icon={THREAT_ICON(ICON_COLORS.threat)} label="Community Threat" sub="Broken lights / hazards" />

                <View style={styles.legendDivider} />
                <Text style={styles.legendSectionHead}>NAVIGATION</Text>
                <View style={styles.legendItem}>
                  <View style={[styles.legendLine, { backgroundColor: C.purple }]} />
                  <Text style={styles.legendLabel}>AI Safe Path</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={styles.currentLocCircle} />
                  <Text style={styles.legendLabel}>Your Position</Text>
                </View>
              </View>
            )}
          </View>
        </View>
      )}

      {!isSOSActive && (
        <Animated.View style={[styles.sidebar, { transform: [{ translateX: panelTranslate }] }]}>
          <ScrollView contentContainerStyle={styles.sidebarContent}>
            <TouchableOpacity style={styles.locRow} onPress={handleLocateMe}>
              <View style={styles.locDot} />
              <View><Text style={styles.locLabel}>MY LOCATION</Text><Text style={styles.locName}>{userLocName}</Text></View>
            </TouchableOpacity>
            <View style={styles.divider} />
            <View style={styles.scoreRow}>
              <ScoreRing score={activeSafeZones.length > 0 ? 82 : 0} />
              <View style={styles.statsGrid}>
                <StatTile icon="⚠️" value={activeThreats.length} label="THREATS" />
                <StatTile icon="🛡️" value={activeSafeZones.length} label="SAFE" accent />
              </View>
            </View>
            <View style={styles.divider} />
            <Text style={styles.sectionHead}>MAP LAYERS</Text>
            <LayerToggle label="Safe Paths" icon="🛤️" active={showPaths} onPress={() => setShowPaths(!showPaths)} />
            <LayerToggle label="Threat Zones" icon="🔴" active={showThreats} onPress={() => setShowThreats(!showThreats)} />
            <LayerToggle label="Safe Zones" icon="🟢" active={showSafeZones} onPress={() => setShowSafeZones(!showSafeZones)} />
          </ScrollView>
        </Animated.View>
      )}

      {isSOSActive ? <View style={styles.sosOverlay}><PanicButton /></View> : <View style={styles.sosFloat}><PanicButton /></View>}
    </View>
  );
};

const SIDEBAR_W = 220;
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 14 },
  loadingText: { color: C.textSub, fontSize: 13 },
  legendBar: { position: 'absolute', top: 0, left: SIDEBAR_W, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 15, backgroundColor: C.panel, zIndex: 50, borderBottomWidth: 1, borderBottomColor: C.panelBorder },
  searchWrapper: { width: 300, position: 'relative', zIndex: 999 },
  searchContainer: { width: '100%', height: 36, flexDirection: 'row', backgroundColor: C.surface, borderRadius: 6, borderWidth: 1, borderColor: C.border },
  searchInput: { flex: 1, color: C.text, paddingHorizontal: 12, fontSize: 13, outlineStyle: 'none' },
  searchButton: { paddingHorizontal: 12, justifyContent: 'center' },
  suggestionsDropdown: { position: 'absolute', top: 42, left: 0, right: 0, backgroundColor: C.surface, borderRadius: 6, borderWidth: 1, borderColor: C.panelBorder },
  suggestionItem: { padding: 10, borderBottomWidth: 1, borderBottomColor: C.border },
  suggestionTitle: { color: C.text, fontSize: 13 },
  
  // ─── LEGEND STYLES ───
  legendWrapper: { position: 'relative', zIndex: 999 },
  legendTrigger: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6, borderWidth: 1, borderColor: C.border },
  legendTriggerText: { color: C.text, fontSize: 13, fontWeight: '600' },
  legendDropdown: { position: 'absolute', top: 42, right: 0, backgroundColor: C.surface, padding: 16, borderRadius: 8, borderWidth: 1, borderColor: C.border, shadowColor: '#000', shadowOpacity: 0.6, shadowRadius: 15, elevation: 10, width: 240, gap: 12 },
  legendSectionHead: { color: C.purpleBright, fontSize: 9, fontWeight: '800', letterSpacing: 1.5, marginBottom: 4 },
  legendGrid: { gap: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  legendIconContainer: { width: 20, height: 20, transform: [{ scale: 0.7 }] }, 
  legendLabel: { color: C.text, fontSize: 12, fontWeight: '600' },
  legendSubLabel: { color: C.textMuted, fontSize: 10 },
  legendDivider: { height: 1, backgroundColor: C.border, marginVertical: 4 },
  legendLine: { width: 20, height: 3, borderRadius: 2 },
  currentLocCircle: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#4285F4', borderWidth: 2, borderColor: '#fff' },

  previewContainer: { position: 'absolute', top: 70, right: 20, zIndex: 100 },
  sidebar: { position: 'absolute', top: 0, bottom: 0, left: 0, width: SIDEBAR_W, backgroundColor: C.panel, borderRightWidth: 1, borderRightColor: C.panelBorder, zIndex: 100 },
  sidebarContent: { paddingTop: 48, paddingHorizontal: 14, gap: 14 },
  locRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  locDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: C.purple },
  locLabel: { color: C.textMuted, fontSize: 9 },
  locName: { color: C.text, fontSize: 13, fontWeight: '700' },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  ringOuter: { width: 62, height: 62, borderRadius: 31, borderWidth: 4, borderColor: C.teal, justifyContent: 'center', alignItems: 'center' },
  ringInner: { alignItems: 'center' },
  scoreNum: { color: C.text, fontSize: 18, fontWeight: '800' },
  scoreLabel:{ color: C.textMuted, fontSize: 7 },
  statsGrid: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  statTile: { width: '47%', backgroundColor: C.surface, borderRadius: 8, padding: 7, alignItems: 'center' },
  statTileAccent: { borderColor: C.teal, borderWidth: 1 },
  statIcon: { fontSize: 13 },
  statValue: { color: C.text, fontSize: 14, fontWeight: '800' },
  statLabel: { color: C.textMuted, fontSize: 8 },
  divider: { height: 1, backgroundColor: C.border },
  sectionHead: { color: C.textMuted, fontSize: 9 },
  layerRow: { flexDirection: 'row', alignItems: 'center', gap: 9, backgroundColor: C.surface, borderRadius: 10, padding: 10 },
  layerIcon: { fontSize: 13 },
  layerLabel: { flex: 1, color: C.textSub, fontSize: 11, fontWeight: '600' },
  pill: { width: 30, height: 17, borderRadius: 9, backgroundColor: C.panelBorder, padding: 2 },
  pillKnob: { width: 13, height: 13, borderRadius: 7, backgroundColor: C.textMuted },
  pillKnobOn: { backgroundColor: '#fff', marginLeft: 'auto' },
  chevronWrap: { position: 'absolute', top: '50%', left: SIDEBAR_W, width: 22, height: 48, backgroundColor: C.panel, justifyContent: 'center', alignItems: 'center' },
  chevron: { color: C.purpleBright, fontSize: 16 },
  sosFloat: { position: 'absolute', bottom: 0, right: 0, transform: [{ scale: 0.75 }] },
  sosOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(8,8,16,0.97)', justifyContent: 'center', alignItems: 'center' },
});

export default MapScreen;