/**
 * MapScreen.jsx  –  Project Guardian
 * THE CLEAN VERSION: CARTO Tiles, Mobile-Responsive Sidebar, Mumbai Defaults
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator, TouchableOpacity,
  ScrollView, Animated, Platform, TextInput, Keyboard, useWindowDimensions
} from 'react-native';
import * as Location from 'expo-location';

import LeafletMap from '../components/LeafletMap';
import { getMapOverlay } from '../db/database';
import { PanicButton, useSOS, SOS_STATE } from '../modules/emergency';
import { ICON_COLORS, safeZoneIcon, THREAT_ICON, CURRENT_LOCATION_ICON } from '../modules/map/MapIcons';

const C = {
  bg: '#080810', panel: 'rgba(14,14,26,0.95)', panelBorder: '#1e1e35',
  surface: '#13131f', purple: '#7c4dff', purpleBright: '#a07dff',
  teal: '#06d6a0', tealDim: 'rgba(6,214,160,0.12)', threat: '#ff3c3c',
  text: '#e8e6f0', textSub: '#9895b0', textMuted: '#504d6a', border: '#1e1e35',
};

// ─── NEW: 100% FREE CARTO DARK TILES (Fixes 401 Error) ───
const TILE_URL = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
const TILE_ATTRIBUTION = '&copy; <a href="https://carto.com/">CARTO</a>';

// ─── MUMBAI ROUTE: Vidyavihar Station to Somaiya Campus ───
const SAFE_PATHS = [
  { 
    coords: [
      [19.0798, 72.8988], [19.0770, 72.8990], 
      [19.0750, 72.8992], [19.0730, 72.8995]
    ] 
  }
];

// Universal SVG Legend Row (Works on Web & Mobile)
const LegendRow = ({ icon, label, sub }) => (
  <View style={styles.legendItem}>
    {Platform.OS === 'web' ? (
      <div 
        style={{ width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center' }} 
        dangerouslySetInnerHTML={{ __html: icon }} 
      />
    ) : (
      <View style={styles.legendIconPlaceholder} />
    )}
    <View style={{ marginLeft: 8 }}>
      <Text style={styles.legendLabel}>{label}</Text>
      {sub && <Text style={styles.legendSubLabel}>{sub}</Text>}
    </View>
  </View>
);

function ScoreRing({ score }) { return (<View style={styles.ringOuter}><View style={styles.ringInner}><Text style={styles.scoreNum}>{score}</Text><Text style={styles.scoreLabel}>SAFE</Text></View></View>); }
function StatTile({ icon, value, label, accent }) { return (<View style={[styles.statTile, accent && styles.statTileAccent]}><Text style={styles.statIcon}>{icon}</Text><Text style={[styles.statValue, accent && { color: C.teal }]}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>); }
function LayerToggle({ label, icon, active, color, onPress }) { const dotColor = color ?? C.purple; return (<TouchableOpacity style={[styles.layerRow, active && { borderColor: dotColor, backgroundColor: `${dotColor}18` }]} onPress={onPress} activeOpacity={0.75}><Text style={styles.layerIcon}>{icon}</Text><Text style={[styles.layerLabel, active && { color: dotColor }]}>{label}</Text><View style={[styles.pill, active && { backgroundColor: dotColor }]}><View style={[styles.pillKnob, active && styles.pillKnobOn]} /></View></TouchableOpacity>); }

const SIDEBAR_W = 240; // Slightly wider for better text fit

const MapScreen = () => {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  
  const [threats, setThreats] = useState([]);
  const [safeZones, setSafeZones] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [showPaths, setShowPaths] = useState(true);
  const [showThreats, setShowThreats] = useState(true);
  const [showSafeZones, setShowSafeZones] = useState(true);
  
  // Start sidebar closed on mobile, open on web
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const sidebarAnim = useRef(new Animated.Value(!isMobile ? 1 : 0)).current;
  
  const { sosState } = useSOS();
  const isSOSActive = sosState !== SOS_STATE.IDLE;

  // FIXED: Removed the duplicate declaration here!
  const [mapCenter, setMapCenter] = useState({ lat: 19.0730, lng: 72.8995 });
  const [userLocName, setUserLocName] = useState('Mumbai, MH');
  
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

  useEffect(() => { loadData(); }, [loadData]);

  const handleLocateMe = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const lat = location.coords.latitude;
      const lng = location.coords.longitude;
      
      setUserLocation({ lat, lng });
      setMapCenter({ lat, lng });

      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
        const data = await res.json();
        if (data && data.address) {
          const city = data.address.city || data.address.town || data.address.suburb || 'Mumbai';
          setUserLocName(`${city}, MH`);
        }
      } catch (err) { setUserLocName('Mumbai, MH'); }
    } catch (error) { console.error(error); }
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
    const name = item.display_name.split(',')[0];
    setSearchQuery(name); 
    setMapCenter({ lat: parseFloat(item.lat), lng: parseFloat(item.lon) });
    setUserLocName(`${name}, MH`);
  };

  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color={C.purple} />
        <Text style={styles.loadingText}>Initialising safety grid…</Text>
      </View>
    );
  }

  // Animation interpolate for sliding sidebar
  const panelTranslate = sidebarAnim.interpolate({ inputRange: [0, 1], outputRange: [-SIDEBAR_W, 0] });
  
  // Animation for Top Bar to slide out of the way of the sidebar
  const topBarTranslate = sidebarAnim.interpolate({ inputRange: [0, 1], outputRange: [0, isMobile ? 0 : SIDEBAR_W] });

  const isNearby = (lat, lng) => {
    const threshold = 0.3; 
    return Math.abs(lat - mapCenter.lat) < threshold && Math.abs(lng - mapCenter.lng) < threshold;
  };

  const activeSafeZones = safeZones.filter(z => isNearby(z.lat || z.latitude, z.lng || z.longitude));
  const activeThreats = threats.filter(t => isNearby(t.lat || t.latitude, t.lng || t.longitude));

  const mapSafeZones = showSafeZones ? activeSafeZones.map(zone => ({ ...zone, svgHtml: safeZoneIcon(zone.type, ICON_COLORS.safe) })) : [];
  let mapThreats = showThreats ? activeThreats.map(threat => ({ ...threat, svgHtml: THREAT_ICON(ICON_COLORS.threat) })) : [];

  return (
    <View style={styles.root}>
      <LeafletMap
        center={mapCenter}
        zoom={15}
        threats={mapThreats}
        safeZones={mapSafeZones}
        safePaths={showPaths ? SAFE_PATHS : []} 
        tileUrl={TILE_URL}
        tileAttribution={TILE_ATTRIBUTION}
        pathColor={C.purple}
      />

      {!isSOSActive && (
        <Animated.View style={[styles.topBarContainer, { transform: [{ translateX: topBarTranslate }] }]}>
          <View style={styles.searchWrapper}>
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search location..."
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
                    <Text style={styles.suggestionTitle} numberOfLines={1}>{item.display_name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <View style={styles.legendWrapper}>
            <TouchableOpacity style={styles.legendTrigger} onPress={() => setShowLegend(!showLegend)}>
              <Text style={styles.legendTriggerText}>Legend {showLegend ? '▲' : '▼'}</Text>
            </TouchableOpacity>

            {showLegend && (
              <ScrollView style={styles.legendDropdown} nestedScrollEnabled>
                <Text style={styles.legendSectionHead}>SAFE LANDMARKS</Text>
                <View style={styles.legendGrid}>
                  <LegendRow icon={safeZoneIcon('hospital')} label="Hospital / ER" />
                  <LegendRow icon={safeZoneIcon('police')} label="Police Station" />
                  <LegendRow icon={safeZoneIcon('fire')} label="Fire Brigade" />
                  <LegendRow icon={safeZoneIcon('pharmacy')} label="24/7 Pharmacy" />
                  <LegendRow icon={safeZoneIcon('railway')} label="Transport Hub" />
                  <LegendRow icon={safeZoneIcon('market')} label="Public Market" />
                </View>
                <View style={styles.legendDivider} />
                <Text style={styles.legendSectionHead}>HAZARDS</Text>
                <LegendRow icon={THREAT_ICON(ICON_COLORS.threat)} label="Community Threat" sub="Unsafe areas" />
                <View style={styles.legendDivider} />
                <Text style={styles.legendSectionHead}>NAVIGATION</Text>
                <View style={styles.legendItem}>
                   <View style={[styles.legendLine, { backgroundColor: C.purple }]} />
                   <Text style={[styles.legendLabel, { marginLeft: 8 }]}>AI Safe Path</Text>
                </View>
              </ScrollView>
            )}
          </View>
        </Animated.View>
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

          {/* ── FIXED MOBILE CHEVRON: Attached directly to the sidebar edge ── */}
          <TouchableOpacity style={styles.chevronWrap} onPress={toggleSidebar}>
            <Text style={styles.chevron}>{sidebarOpen ? '‹' : '›'}</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {isSOSActive ? <View style={styles.sosOverlay}><PanicButton /></View> : <View style={styles.sosFloat}><PanicButton /></View>}
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: C.textSub, fontSize: 13, marginTop: 10 },
  
  // ── Responsive Top Bar ──
  topBarContainer: { position: 'absolute', top: Platform.OS === 'ios' ? 50 : 20, left: 20, right: 20, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', zIndex: 50, gap: 10 },
  searchWrapper: { flex: 1, maxWidth: 300, position: 'relative', zIndex: 999 },
  searchContainer: { height: 42, flexDirection: 'row', backgroundColor: C.panel, borderRadius: 8, borderWidth: 1, borderColor: C.border, shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 10, elevation: 5 },
  searchInput: { flex: 1, color: C.text, paddingHorizontal: 15, fontSize: 14, outlineStyle: 'none' },
  searchButton: { paddingHorizontal: 12, justifyContent: 'center' },
  suggestionsDropdown: { position: 'absolute', top: 48, left: 0, right: 0, backgroundColor: C.surface, borderRadius: 8, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  suggestionItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: C.border },
  suggestionTitle: { color: C.text, fontSize: 13 },
  
  // ── Responsive Legend ──
  legendWrapper: { position: 'relative', zIndex: 999 },
  legendTrigger: { height: 42, flexDirection: 'row', alignItems: 'center', backgroundColor: C.panel, paddingHorizontal: 14, borderRadius: 8, borderWidth: 1, borderColor: C.border, shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 10, elevation: 5 },
  legendTriggerText: { color: C.text, fontSize: 13, fontWeight: '700' },
  legendDropdown: { position: 'absolute', top: 48, right: 0, backgroundColor: C.surface, padding: 16, borderRadius: 8, borderWidth: 1, borderColor: C.border, shadowColor: '#000', shadowOpacity: 0.6, shadowRadius: 15, elevation: 10, width: 220, maxHeight: 400 },
  legendSectionHead: { color: C.purpleBright, fontSize: 10, fontWeight: '800', letterSpacing: 1.5, marginBottom: 8 },
  legendGrid: { gap: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center' },
  legendLabel: { color: C.text, fontSize: 12, fontWeight: '600' },
  legendSubLabel: { color: C.textMuted, fontSize: 10 },
  legendDivider: { height: 1, backgroundColor: C.border, marginVertical: 10 },
  legendLine: { width: 20, height: 3, borderRadius: 2 },

  // ── Responsive Sidebar ──
  sidebar: { position: 'absolute', top: 0, bottom: 0, left: 0, width: SIDEBAR_W, backgroundColor: C.panel, borderRightWidth: 1, borderRightColor: C.panelBorder, zIndex: 100, shadowColor: '#000', shadowOpacity: 0.8, shadowRadius: 20, elevation: 15 },
  sidebarContent: { paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingHorizontal: 16, gap: 16 },
  locRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  locDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: C.purple },
  locLabel: { color: C.textMuted, fontSize: 9 },
  locName: { color: C.text, fontSize: 13, fontWeight: '700' },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  ringOuter: { width: 62, height: 62, borderRadius: 31, borderWidth: 4, borderColor: C.teal, justifyContent: 'center', alignItems: 'center' },
  ringInner: { alignItems: 'center' },
  scoreNum: { color: C.text, fontSize: 18, fontWeight: '800' },
  scoreLabel:{ color: C.textMuted, fontSize: 7 },
  statsGrid: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  statTile: { width: '47%', backgroundColor: C.surface, borderRadius: 8, padding: 8, alignItems: 'center', borderWidth: 1, borderColor: 'transparent' },
  statTileAccent: { borderColor: C.tealDim, backgroundColor: 'rgba(6,214,160,0.05)' },
  statIcon: { fontSize: 13 },
  statValue: { color: C.text, fontSize: 14, fontWeight: '800' },
  statLabel: { color: C.textMuted, fontSize: 8 },
  divider: { height: 1, backgroundColor: C.border },
  sectionHead: { color: C.textMuted, fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  layerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.surface, borderRadius: 10, padding: 12, borderWidth: 1, borderColor: C.border },
  layerIcon: { fontSize: 14 },
  layerLabel: { flex: 1, color: C.textSub, fontSize: 12, fontWeight: '600' },
  pill: { width: 34, height: 20, borderRadius: 10, backgroundColor: C.panelBorder, padding: 2 },
  pillKnob: { width: 16, height: 16, borderRadius: 8, backgroundColor: C.textMuted },
  pillKnobOn: { backgroundColor: '#fff', marginLeft: 'auto' },
  
  // ── Attached Chevron Fix ──
  chevronWrap: { position: 'absolute', top: '50%', right: -24, marginTop: -24, width: 24, height: 48, backgroundColor: C.panel, borderTopRightRadius: 8, borderBottomRightRadius: 8, borderWidth: 1, borderLeftWidth: 0, borderColor: C.panelBorder, justifyContent: 'center', alignItems: 'center' },
  chevron: { color: C.purpleBright, fontSize: 18, fontWeight: 'bold' },
  
  sosFloat: { position: 'absolute', bottom: 10, right: 10, transform: [{ scale: 0.85 }], zIndex: 99 },
  sosOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(8,8,16,0.97)', justifyContent: 'center', alignItems: 'center', zIndex: 9999 },
});

export default MapScreen;