/**
 * MapScreen.jsx – Project Guardian
 * STATUS: Fixed Syntax + Supabase Integrated + Weighted A* Enabled
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator, TouchableOpacity,
  ScrollView, Animated, Platform, TextInput, Keyboard
} from 'react-native';
import * as Location from 'expo-location';

import LeafletMap from '../components/LeafletMap';
import { getMapOverlay } from '../db/database';
import { calculateSafePath } from '../services/navigationService'; 
import { PanicButton, useSOS, SOS_STATE } from '../modules/emergency';
import { ICON_COLORS, safeZoneIcon, THREAT_ICON, CURRENT_LOCATION_ICON } from '../modules/map/MapIcons';

const C = {
  bg: '#080810', panel: 'rgba(14,14,26,0.95)', panelBorder: '#1e1e35',
  surface: '#13131f', purple: '#7c4dff', purpleBright: '#a07dff',
  teal: '#06d6a0', tealDim: 'rgba(6,214,160,0.12)', threat: '#ff3c3c',
  text: '#e8e6f0', textSub: '#9895b0', textMuted: '#504d6a', border: '#1e1e35',
};

const TILE_URL = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
const TILE_ATTRIBUTION = '&copy; <a href="https://carto.com/">CARTO</a>';

// --- Internal Helper Components ---
const LegendRow = ({ icon, label, sub }) => (
  <View style={styles.legendItem}>
    {Platform.OS === 'web' ? (
      <div style={{ width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center' }} dangerouslySetInnerHTML={{ __html: icon }} />
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

const SIDEBAR_W = 220;

const MapScreen = () => {
  // Data State
  const [threats, setThreats] = useState([]);
  const [safeZones, setSafeZones] = useState([]);
  const [safePaths, setSafePaths] = useState([]); 
  const [loading, setLoading] = useState(true);
  
  // UI State
  const [showPaths, setShowPaths] = useState(true);
  const [showThreats, setShowThreats] = useState(true);
  const [showSafeZones, setShowSafeZones] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showLegend, setShowLegend] = useState(false); 
  
  // Animation & Search
  const sidebarAnim = useRef(new Animated.Value(1)).current;
  const { sosState } = useSOS();
  const isSOSActive = sosState !== SOS_STATE.IDLE;
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceTimeout = useRef(null);

  // Map Focus
  const [mapCenter, setMapCenter] = useState({ lat: 19.0730, lng: 72.8995 });
  const [userLocation, setUserLocation] = useState({ lat: 19.0730, lng: 72.8995 });
  const [userLocName, setUserLocName] = useState('Mumbai, MH');

  const toggleSidebar = useCallback(() => {
    const next = sidebarOpen ? 0 : 1;
    Animated.spring(sidebarAnim, { toValue: next, tension: 80, friction: 12, useNativeDriver: true }).start();
    setSidebarOpen(p => !p);
  }, [sidebarOpen, sidebarAnim]);

  // Load Data from Supabase and calculate initial path
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getMapOverlay();
      setThreats(data.threats || []);
      setSafeZones(data.safeZones || []);
      
      // Calculate initial demo path: Vidyavihar Station to Somaiya Campus
      if (data.threats) {
        const path = calculateSafePath([19.0798, 72.8988], [19.0730, 72.8995], data.threats);
        setSafePaths([{ coords: path }]);
      }
    } catch (err) { 
      console.error("[Map] Load Failed:", err); 
    } finally { 
      setLoading(false); 
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleLocateMe = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const newLoc = { lat: location.coords.latitude, lng: location.coords.longitude };
      setUserLocation(newLoc);
      setMapCenter(newLoc);
    } catch (error) { 
      console.error("[Location] Error:", error); 
    }
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
      } catch (err) { 
        console.error("[Search] Failed:", err); 
      } finally { 
        setIsSearching(false); 
      }
    }, 500);
  };

  const handleSelectSuggestion = (item) => {
    Keyboard.dismiss();
    setShowSuggestions(false);
    const lat = parseFloat(item.lat);
    const lng = parseFloat(item.lon);
    setSearchQuery(item.display_name.split(',')[0]); 
    setMapCenter({ lat, lng });

    // Recalculate A* Safe Path from current user position to new search destination
    const newPath = calculateSafePath([userLocation.lat, userLocation.lng], [lat, lng], threats);
    setSafePaths([{ coords: newPath }]);
  };

  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color={C.purple} />
        <Text style={styles.loadingText}>Initialising safety grid…</Text>
      </View>
    );
  }

  const panelTranslate = sidebarAnim.interpolate({ inputRange: [0, 1], outputRange: [-SIDEBAR_W, 0] });

  return (
    <View style={styles.root}>
      <LeafletMap
        center={mapCenter}
        zoom={15}
        threats={showThreats ? threats.map(t => ({ ...t, svgHtml: THREAT_ICON(ICON_COLORS.threat) })) : []}
        safeZones={showSafeZones ? safeZones.map(z => ({ ...z, svgHtml: safeZoneIcon(z.category, ICON_COLORS.safe) })) : []}
        safePaths={showPaths ? safePaths : []} 
        tileUrl={TILE_URL}
        tileAttribution={TILE_ATTRIBUTION}
        pathColor={C.purple}
      />

      {/* Solid Top Legend Bar */}
      {!isSOSActive && (
        <View style={styles.legendBar}>
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
                    <Text style={styles.suggestionTitle}>{item.display_name.split(',')[0]}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <View style={styles.legendWrapper}>
            <TouchableOpacity style={styles.legendTrigger} onPress={() => setShowLegend(!showLegend)}>
              <Text style={styles.legendTriggerText}>Map Legend {showLegend ? '▲' : '▼'}</Text>
            </TouchableOpacity>

            {showLegend && (
              <View style={styles.legendDropdown}>
                <Text style={styles.legendSectionHead}>SAFE LANDMARKS</Text>
                <View style={styles.legendGrid}>
                  <LegendRow icon={safeZoneIcon('hospital')} label="Hospital" />
                  <LegendRow icon={safeZoneIcon('police')} label="Police Station" />
                </View>
                <View style={styles.legendDivider} />
                <Text style={styles.legendSectionHead}>HAZARDS</Text>
                <LegendRow icon={THREAT_ICON(ICON_COLORS.threat)} label="Community Threat" />
              </View>
            )}
          </View>
        </View>
      )}

      {/* Sliding Sidebar */}
      {!isSOSActive && (
        <Animated.View style={[styles.sidebar, { transform: [{ translateX: panelTranslate }] }]}>
          <ScrollView contentContainerStyle={styles.sidebarContent}>
            <TouchableOpacity style={styles.locRow} onPress={handleLocateMe}>
              <View style={styles.locDot} />
              <View><Text style={styles.locLabel}>MY LOCATION</Text><Text style={styles.locName}>{userLocName}</Text></View>
            </TouchableOpacity>
            <View style={styles.divider} />
            <View style={styles.scoreRow}>
              <ScoreRing score={threats.length < 5 ? 82 : 45} />
              <View style={styles.statsGrid}>
                <StatTile icon="⚠️" value={threats.length} label="THREATS" />
                <StatTile icon="🛡️" value={safeZones.length} label="SAFE" accent />
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

      {/* Floating Chevron */}
      {!isSOSActive && (
        <Animated.View style={[styles.chevronWrap, { transform: [{ translateX: sidebarAnim.interpolate({ inputRange: [0, 1], outputRange: [0, SIDEBAR_W] }) }] }]}>
          <TouchableOpacity onPress={toggleSidebar} style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={styles.chevron}>{sidebarOpen ? '‹' : '›'}</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Emergency Overlays */}
      {isSOSActive ? <View style={styles.sosOverlay}><PanicButton /></View> : <View style={styles.sosFloat}><PanicButton /></View>}
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: C.textSub, fontSize: 13, marginTop: 10 },
  legendBar: { position: 'absolute', top: 0, left: SIDEBAR_W, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 15, backgroundColor: C.panel, zIndex: 50, borderBottomWidth: 1, borderBottomColor: C.panelBorder },
  searchWrapper: { width: 300, position: 'relative', zIndex: 999 },
  searchContainer: { width: '100%', height: 36, flexDirection: 'row', backgroundColor: C.surface, borderRadius: 6, borderWidth: 1, borderColor: C.border },
  searchInput: { flex: 1, color: C.text, paddingHorizontal: 12, fontSize: 13, outlineStyle: 'none' },
  searchButton: { paddingHorizontal: 12, justifyContent: 'center' },
  suggestionsDropdown: { position: 'absolute', top: 42, left: 0, right: 0, backgroundColor: C.surface, borderRadius: 6, borderWidth: 1, borderColor: C.panelBorder, overflow: 'hidden' },
  suggestionItem: { padding: 10, borderBottomWidth: 1, borderBottomColor: C.border },
  suggestionTitle: { color: C.text, fontSize: 13 },
  legendWrapper: { position: 'relative', zIndex: 999 },
  legendTrigger: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6, borderWidth: 1, borderColor: C.border },
  legendTriggerText: { color: C.text, fontSize: 13, fontWeight: '600' },
  legendDropdown: { position: 'absolute', top: 42, right: 0, backgroundColor: C.surface, padding: 16, borderRadius: 8, borderWidth: 1, borderColor: C.border, shadowColor: '#000', shadowOpacity: 0.6, shadowRadius: 15, width: 240, gap: 12 },
  legendSectionHead: { color: C.purpleBright, fontSize: 9, fontWeight: '800', letterSpacing: 1.5, marginBottom: 4 },
  legendGrid: { gap: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center' },
  legendLabel: { color: C.text, fontSize: 12, fontWeight: '600' },
  legendSubLabel: { color: C.textMuted, fontSize: 10 },
  legendDivider: { height: 1, backgroundColor: C.border, marginVertical: 4 },
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
  chevronWrap: { position: 'absolute', top: '50%', left: 0, marginTop: -24, width: 22, height: 48, backgroundColor: C.panel, borderTopRightRadius: 8, borderBottomRightRadius: 8, borderWidth: 1, borderLeftWidth: 0, borderColor: C.panelBorder, zIndex: 110 },
  chevron: { color: C.purpleBright, fontSize: 16 },
  sosFloat: { position: 'absolute', bottom: 0, right: 0, transform: [{ scale: 0.75 }] },
  sosOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(8,8,16,0.97)', justifyContent: 'center', alignItems: 'center' },
});

export default MapScreen;