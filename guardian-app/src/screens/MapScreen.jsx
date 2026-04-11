import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, StyleSheet, ActivityIndicator,
  TouchableOpacity, Platform, Keyboard,
} from 'react-native';
import colors from '../theme/colors';
import LeafletMap from '../components/LeafletMap';
import PanicButton from '../components/PanicButton';
import { getMapOverlay } from '../db/database';
import { AHMEDABAD } from '../utils/location';
import { compareRoutes } from '../services/safetyInferenceEngine';

// ─── Pre-defined route pairs for demo ───
// "Fastest" cuts through threat areas; "Safest" routes via safe zones.
const DEMO_ROUTES = {
  'kankaria': {
    label: 'Kankaria Lake',
    fastest: [
      [23.0225, 72.5714], [23.0200, 72.5750], [23.0170, 72.5800],
      [23.0140, 72.5850], [23.0100, 72.5900], [23.0069, 72.6005],
    ],
    safest: [
      [23.0225, 72.5714], [23.0242, 72.5720], [23.0220, 72.5750],
      [23.0195, 72.5680], [23.0140, 72.5680], [23.0120, 72.5750],
      [23.0100, 72.5850], [23.0069, 72.6005],
    ],
  },
  'sabarmati': {
    label: 'Sabarmati Ashram',
    fastest: [
      [23.0225, 72.5714], [23.0300, 72.5700], [23.0400, 72.5720],
      [23.0500, 72.5760], [23.0607, 72.5802],
    ],
    safest: [
      [23.0225, 72.5714], [23.0242, 72.5720], [23.0305, 72.5653],
      [23.0380, 72.5580], [23.0488, 72.5700], [23.0550, 72.5780],
      [23.0607, 72.5802],
    ],
  },
  'iim': {
    label: 'IIM Ahmedabad',
    fastest: [
      [23.0225, 72.5714], [23.0260, 72.5600], [23.0290, 72.5480],
      [23.0310, 72.5350], [23.0327, 72.5279],
    ],
    safest: [
      [23.0225, 72.5714], [23.0242, 72.5720], [23.0305, 72.5653],
      [23.0330, 72.5570], [23.0350, 72.5450], [23.0340, 72.5350],
      [23.0327, 72.5279],
    ],
  },
  'sg highway': {
    label: 'SG Highway',
    fastest: [
      [23.0225, 72.5714], [23.0250, 72.5600], [23.0270, 72.5400],
      [23.0280, 72.5200], [23.0280, 72.5070],
    ],
    safest: [
      [23.0225, 72.5714], [23.0305, 72.5653], [23.0330, 72.5570],
      [23.0310, 72.5400], [23.0280, 72.5250], [23.0195, 72.5250],
      [23.0280, 72.5070],
    ],
  },
};

// Default safe paths (when no search is active)
const DEFAULT_SAFE_PATHS = [
  [[23.0305, 72.5653], [23.0330, 72.5570], [23.0365, 72.5463]],
  [[23.0242, 72.5720], [23.0225, 72.5714], [23.0140, 72.5680]],
  [[23.0380, 72.5580], [23.0330, 72.5570], [23.0305, 72.5653]],
];

const MapScreen = () => {
  const [threats, setThreats] = useState([]);
  const [safeZones, setSafeZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [activeRoute, setActiveRoute] = useState(null); // key into DEMO_ROUTES
  const [aiScore, setAiScore] = useState(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const overlay = await getMapOverlay();
      setThreats(overlay.threats);
      setSafeZones(overlay.safeZones);
    } catch (error) {
      console.error('Failed to load map data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSearch = () => {
    Keyboard.dismiss();
    const query = searchText.toLowerCase().trim();
    if (!query) {
      setActiveRoute(null);
      setAiScore(null);
      return;
    }

    // Match against demo routes
    const matched = Object.keys(DEMO_ROUTES).find((key) => query.includes(key));
    if (matched) {
      setActiveRoute(matched);

      // Run AI inference engine
      const route = DEMO_ROUTES[matched];
      const inference = compareRoutes(route.fastest, route.safest, threats, safeZones);
      setAiScore(inference);
    } else {
      // Default to Kankaria for any unmatched search
      setActiveRoute('kankaria');
      const route = DEMO_ROUTES['kankaria'];
      const inference = compareRoutes(route.fastest, route.safest, threats, safeZones);
      setAiScore(inference);
    }
  };

  const clearSearch = () => {
    setSearchText('');
    setActiveRoute(null);
    setAiScore(null);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.safe} />
        <Text style={styles.loadingText}>Loading safety data...</Text>
      </View>
    );
  }

  const route = activeRoute ? DEMO_ROUTES[activeRoute] : null;

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Where are you going? (try: Kankaria, IIM, Sabarmati)"
            placeholderTextColor="#555"
            value={searchText}
            onChangeText={setSearchText}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {searchText ? (
            <TouchableOpacity onPress={clearSearch} style={styles.clearBtn}>
              <Text style={styles.clearText}>✕</Text>
            </TouchableOpacity>
          ) : null}
        </View>
        {searchText ? (
          <TouchableOpacity style={styles.goBtn} onPress={handleSearch}>
            <Text style={styles.goBtnText}>Route</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Route info bar */}
      {route && aiScore && (
        <View style={styles.routeBar}>
          <View style={styles.routeInfo}>
            <Text style={styles.routeLabel}>→ {route.label}</Text>
            <View style={styles.routeScores}>
              <View style={styles.scorePill}>
                <View style={[styles.scoreDot, { backgroundColor: '#4488ff' }]} />
                <Text style={styles.scoreText}>Fastest {aiScore.fastest_route_score}</Text>
              </View>
              <View style={[styles.scorePill, styles.scorePillActive]}>
                <View style={[styles.scoreDot, { backgroundColor: colors.safe }]} />
                <Text style={[styles.scoreText, { color: colors.safe }]}>
                  Safest {aiScore.safest_route_score}
                </Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Legend (when no route active) */}
      {!activeRoute && (
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: colors.safe }]} />
            <Text style={styles.legendLabel}>Safe ({safeZones.length})</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: colors.threat }]} />
            <Text style={styles.legendLabel}>Threats ({threats.length})</Text>
          </View>
        </View>
      )}

      {/* Map */}
      <LeafletMap
        center={{ lat: AHMEDABAD.latitude, lng: AHMEDABAD.longitude }}
        zoom={activeRoute ? 14 : 13}
        threats={threats}
        safeZones={safeZones}
        fastestRoute={route ? route.fastest : []}
        safestRoute={route ? route.safest : DEFAULT_SAFE_PATHS.flat().length > 0 ? DEFAULT_SAFE_PATHS[0] : []}
        aiScore={activeRoute ? aiScore : null}
        threatClusters={aiScore?.detailed?.threat_clusters || []}
      />

      {/* Panic Button */}
      <PanicButton />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  loadingContainer: {
    flex: 1, backgroundColor: colors.bg,
    justifyContent: 'center', alignItems: 'center', gap: 12,
  },
  loadingText: { color: colors.textSecondary, fontSize: 14 },

  // Search
  searchContainer: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 8,
    backgroundColor: colors.bg, gap: 8, zIndex: 20,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  searchBar: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface, borderRadius: 10,
    paddingHorizontal: 12, height: 42,
    borderWidth: 1, borderColor: colors.border,
  },
  searchIcon: { fontSize: 14, marginRight: 8 },
  searchInput: {
    flex: 1, color: colors.textPrimary, fontSize: 13,
    ...Platform.select({ web: { outlineStyle: 'none' } }),
  },
  clearBtn: { padding: 4 },
  clearText: { color: colors.textMuted, fontSize: 14 },
  goBtn: {
    backgroundColor: colors.safe, borderRadius: 10,
    paddingHorizontal: 16, height: 42, justifyContent: 'center',
  },
  goBtnText: { color: colors.bg, fontSize: 13, fontWeight: '700' },

  // Route bar
  routeBar: {
    paddingHorizontal: 12, paddingVertical: 8,
    backgroundColor: colors.surface,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  routeInfo: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  routeLabel: { color: colors.textPrimary, fontSize: 14, fontWeight: '600' },
  routeScores: { flexDirection: 'row', gap: 8 },
  scorePill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6,
    backgroundColor: 'rgba(68,136,255,0.1)',
  },
  scorePillActive: { backgroundColor: colors.safeDim },
  scoreDot: { width: 6, height: 6, borderRadius: 3 },
  scoreText: { color: '#4488ff', fontSize: 11, fontWeight: '600' },

  // Legend
  legend: {
    flexDirection: 'row', justifyContent: 'center',
    paddingVertical: 6, backgroundColor: colors.surface,
    gap: 20, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  legendLabel: { color: colors.textMuted, fontSize: 11 },
});

export default MapScreen;
