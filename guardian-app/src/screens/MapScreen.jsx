/**
 * MapScreen.jsx  –  Project Guardian
 *
 * Changes in this revision:
 * • Safe zones → teal (#06d6a0) to contrast purple paths + red threats
 * • Safe paths → follow Ahmedabad road grid (right-angle turns, no diagonal cuts)
 * • FAB refresh removed; sidebar refresh button moved to bottom
 * • SOS button → purple theme via updated PanicButton
 * • Minimalist SVG icons injected directly into Leaflet data props
 *
 * Drop into: src/screens/MapScreen.jsx
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  Animated,
  Platform,
} from 'react-native';

import LeafletMap from '../components/LeafletMap';
import JourneySummaryPopup from '../components/JourneySummaryPopup';
import { getMapOverlay } from '../db/database';
import { AHMEDABAD } from '../utils/location';
import { summarizeJourney } from '../services/journeyAI';
import { PanicButton, useSOS, SOS_STATE } from '../modules/emergency';

// ─── UPDATED IMPORT: Pull in the specific icon generators ───
import { ICON_COLORS, safeZoneIcon, THREAT_ICON } from '../modules/map/MapIcons';

// ─── Colour palette ────────────────────────────────────────────────────────────
const C = {
  bg:          '#080810',
  panel:       'rgba(14,14,26,0.95)',
  panelBorder: '#1e1e35',
  surface:     '#13131f',
  purple:      '#7c4dff',
  purpleDim:   'rgba(124,77,255,0.14)',
  purpleBright:'#a07dff',
  teal:        '#06d6a0',
  tealDim:     'rgba(6,214,160,0.12)',
  threat:      '#ff3c3c',
  text:        '#e8e6f0',
  textSub:     '#9895b0',
  textMuted:   '#504d6a',
  border:      '#1e1e35',
};

const TILE_URL = 'https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png';
const TILE_ATTRIBUTION = '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a> &copy; OpenMapTiles &copy; OpenStreetMap';

const SAFE_PATHS = [
  { coords: [ [23.0305, 72.5653], [23.0305, 72.5580], [23.0305, 72.5540], [23.0335, 72.5540], [23.0365, 72.5540], [23.0365, 72.5463] ] },
  { coords: [ [23.0242, 72.5720], [23.0195, 72.5720], [23.0140, 72.5720], [23.0140, 72.5680], [23.0140, 72.5640] ] },
  { coords: [ [23.0380, 72.5580], [23.0380, 72.5540], [23.0330, 72.5540], [23.0305, 72.5540] ] },
];

const CURRENT_JOURNEY = {
  title: 'Paldi to SG Highway Safety Preview',
  start: 'Paldi Market',
  end: 'SG Highway Service Road',
  route: SAFE_PATHS[0].coords,
  segments: [
    {
      street: 'Ashram Road',
      locality: 'Paldi',
      characteristics: 'busy commercial stretch with shopping and light traffic',
    },
    {
      street: 'Navrangpura Road',
      locality: 'Navrangpura',
      characteristics: 'wider boulevard with moderate traffic and better lighting',
    },
    {
      street: 'SG Highway Service Road',
      locality: 'Thaltej',
      characteristics: 'quieter outer stretch with pockets of dim street lighting',
    },
  ],
};

const MOCK_STATS = { safeScore: 82, nearbyUnits: 3, etaMinutes: 7 };

function ScoreRing({ score }) {
  return (
    <View style={styles.ringOuter}>
      <View style={styles.ringInner}>
        <Text style={styles.scoreNum}>{score}</Text>
        <Text style={styles.scoreLabel}>SAFE</Text>
      </View>
    </View>
  );
}

function StatTile({ icon, value, label, accent }) {
  return (
    <View style={[styles.statTile, accent && styles.statTileAccent]}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={[styles.statValue, accent && { color: C.teal }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function LayerToggle({ label, icon, active, color, onPress }) {
  const dotColor = color ?? C.purple;
  return (
    <TouchableOpacity
      style={[styles.layerRow, active && { borderColor: dotColor, backgroundColor: `${dotColor}18` }]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <Text style={styles.layerIcon}>{icon}</Text>
      <Text style={[styles.layerLabel, active && { color: dotColor }]}>{label}</Text>
      <View style={[styles.pill, active && { backgroundColor: dotColor }]}>
        <View style={[styles.pillKnob, active && styles.pillKnobOn]} />
      </View>
    </TouchableOpacity>
  );
}

const MapScreen = () => {
  const [threats,          setThreats]          = useState([]);
  const [safeZones,        setSafeZones]        = useState([]);
  const [loading,          setLoading]          = useState(true);
  const [journeyLoading,   setJourneyLoading]   = useState(false);
  const [journeySummary,   setJourneySummary]   = useState(null);
  const [showPaths,        setShowPaths]        = useState(true);
  const [showThreats,      setShowThreats]      = useState(true);
  const [showSafeZones,    setShowSafeZones]    = useState(true);
  const [sidebarOpen,      setSidebarOpen]      = useState(true);

  const sidebarAnim = useRef(new Animated.Value(1)).current;
  const { sosState } = useSOS();
  const isSOSActive  = sosState !== SOS_STATE.IDLE;

  const toggleSidebar = useCallback(() => {
    const next = sidebarOpen ? 0 : 1;
    Animated.spring(sidebarAnim, { toValue: next, tension: 80, friction: 12, useNativeDriver: true }).start();
    setSidebarOpen((p) => !p);
  }, [sidebarOpen]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const overlay = await getMapOverlay();
      setThreats(overlay.threats);
      setSafeZones(overlay.safeZones);
    } catch (err) {
      console.error('[MapScreen] loadData error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    loadJourneySummary();
  }, [loadData]);

  const loadJourneySummary = async () => {
    setJourneyLoading(true);
    try {
      const summary = await summarizeJourney(CURRENT_JOURNEY);
      setJourneySummary(summary);
    } catch (error) {
      console.error('Failed to load journey summary:', error);
    } finally {
      setJourneyLoading(false);
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

  const panelTranslate = sidebarAnim.interpolate({
    inputRange: [0, 1], outputRange: [-220, 0],
  });

  // ─── NEW INJECTION LOGIC ──────────────────────────────────────────────
  // We generate the raw SVG strings here and pass them down as text.
  
  const mapSafeZones = showSafeZones ? safeZones.map(zone => ({
    ...zone,
    svgHtml: safeZoneIcon(zone.type, ICON_COLORS.safe)
  })) : [];

  const mapThreats = showThreats ? threats.map(threat => ({
    ...threat,
    svgHtml: THREAT_ICON(ICON_COLORS.threat)
  })) : [];
  // ──────────────────────────────────────────────────────────────────────

  return (
    <View style={styles.root}>

      <LeafletMap
        center={{ lat: AHMEDABAD.latitude, lng: AHMEDABAD.longitude }}
        zoom={13}
        threats={mapThreats}
        safeZones={mapSafeZones}
        safePaths={showPaths ? SAFE_PATHS : []}
        tileUrl={TILE_URL}
        tileAttribution={TILE_ATTRIBUTION}
        pathColor={ICON_COLORS.path}
        safeZoneColor={ICON_COLORS.safe}
        threatColor={ICON_COLORS.threat}
        pathWeight={3}
      />

      {journeySummary && (
        <JourneySummaryPopup
          summary={journeySummary}
          loading={journeyLoading}
          onRefresh={loadJourneySummary}
        />
      )}

      {/* ── Top legend bar ── */}
      {!isSOSActive && (
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: C.teal }]} />
            <Text style={styles.legendLabel}>Safe Zones ({safeZones.length})</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: C.threat }]} />
            <Text style={styles.legendLabel}>Threats ({threats.length})</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: C.purple }]} />
            <Text style={styles.legendLabel}>Safe Paths</Text>
          </View>
        </View>
      )}

      {/* ── Sidebar ── */}
      {!isSOSActive && (
        <Animated.View style={[styles.sidebar, { transform: [{ translateX: panelTranslate }] }]}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.sidebarContent}>
            <View style={styles.locRow}>
              <View style={styles.locDot} />
              <View>
                <Text style={styles.locLabel}>MY LOCATION</Text>
                <Text style={styles.locName}>Ahmedabad, GJ</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.scoreRow}>
              <ScoreRing score={MOCK_STATS.safeScore} />
              <View style={styles.statsGrid}>
                <StatTile icon="⚠️" value={threats.length} label="THREATS" />
                <StatTile icon="🛡️" value={safeZones.length} label="SAFE" accent />
                <StatTile icon="🚔" value={MOCK_STATS.nearbyUnits} label="UNITS" />
                <StatTile icon="⏱️" value={`${MOCK_STATS.etaMinutes}m`} label="ETA" />
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

      {/* ── Sidebar chevron toggle ── */}
      {!isSOSActive && (
        <TouchableOpacity style={[styles.chevronWrap, sidebarOpen && { left: 220 }]} onPress={toggleSidebar}>
          <Text style={styles.chevron}>{sidebarOpen ? '‹' : '›'}</Text>
        </TouchableOpacity>
      )}

      {/* ── SOS layer ── */}
      {isSOSActive ? (
        <View style={styles.sosOverlay}>
          <PanicButton />
        </View>
      ) : (
        <View style={styles.sosFloat}>
          <PanicButton />
        </View>
      )}

    </View>
  );
};

const SIDEBAR_W = 220;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  loadingWrap: { flex: 1, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center', gap: 14 },
  loadingText: { color: C.textSub, fontSize: 13, letterSpacing: 1 },
  legend: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, paddingHorizontal: 12, backgroundColor: 'rgba(14,14,26,0.90)', gap: 16, zIndex: 50, borderBottomWidth: 1, borderBottomColor: C.panelBorder },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendLabel: { color: C.textSub, fontSize: 11 },
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