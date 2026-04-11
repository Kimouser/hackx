import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import colors from '../theme/colors';
import LeafletMap from '../components/LeafletMap';
import JourneySummaryPopup from '../components/JourneySummaryPopup';
import { getMapOverlay } from '../db/database';
import { AHMEDABAD } from '../utils/location';
import { summarizeJourney } from '../services/journeyAI';

// ─── NEW EMERGENCY MODULE ──────────────────────────────────────────
import { PanicButton, useSOS, SOS_STATE } from '../modules/emergency';
// ───────────────────────────────────────────────────────────────────

const SAFE_PATHS = [
  { coords: [[23.0305, 72.5653], [23.0310, 72.5600], [23.0325, 72.5560], [23.0330, 72.5570], [23.0365, 72.5463]] },
  { coords: [[23.0242, 72.5720], [23.0258, 72.5714], [23.0225, 72.5714], [23.0195, 72.5680], [23.0140, 72.5680]] },
  { coords: [[23.0380, 72.5580], [23.0350, 72.5560], [23.0330, 72.5570], [23.0305, 72.5653]] },
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

const MapScreen = () => {
  const [threats, setThreats] = useState([]);
  const [safeZones, setSafeZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [journeyLoading, setJourneyLoading] = useState(false);
  const [journeySummary, setJourneySummary] = useState(null);
  const [showSafePaths, setShowSafePaths] = useState(true);

  // Bring in the SOS State to control the UI
  const { sosState } = useSOS();

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
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.safe} />
        <Text style={styles.loadingText}>Loading safety map...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Legend bar */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: colors.safe }]} />
          <Text style={styles.legendLabel}>Safe Zones ({safeZones.length})</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: colors.threat }]} />
          <Text style={styles.legendLabel}>Threats ({threats.length})</Text>
        </View>
        <TouchableOpacity
          style={[styles.pathToggle, showSafePaths && styles.pathToggleActive]}
          onPress={() => setShowSafePaths(!showSafePaths)}
        >
          <Text style={[styles.pathToggleText, showSafePaths && styles.pathToggleTextActive]}>
            Safe Paths
          </Text>
        </TouchableOpacity>
      </View>

      {/* Leaflet Map */}
      <LeafletMap
        center={{ lat: AHMEDABAD.latitude, lng: AHMEDABAD.longitude }}
        zoom={13}
        threats={threats}
        safeZones={safeZones}
        safePaths={showSafePaths ? SAFE_PATHS : []}
        journeyRoute={CURRENT_JOURNEY.route}
      />

      <JourneySummaryPopup
        summary={journeySummary}
        loading={journeyLoading}
        onRefresh={loadJourneySummary}
      />

      {/* Safe spaces FAB */}
      <TouchableOpacity style={styles.safeFab} onPress={loadData}>
        <Text style={styles.safeFabText}>🔄</Text>
      </TouchableOpacity>

      {/* ─── DYNAMIC SOS BUTTON LAYER ─── */}
      {sosState === SOS_STATE.IDLE ? (
        // When IDLE: Float in the bottom right corner, scaled down slightly
        <View style={styles.floatingSOS}>
          <PanicButton />
        </View>
      ) : (
        // When ACTIVE: Take over the screen with a dark overlay
        <View style={styles.activeSOSContainer}>
          <PanicButton />
        </View>
      )}

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
  legend: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 8, paddingHorizontal: 12,
    backgroundColor: colors.surface, gap: 16, zIndex: 10,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  legendLabel: { color: colors.textSecondary, fontSize: 11 },
  pathToggle: {
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 6, borderWidth: 1, borderColor: colors.border,
  },
  pathToggleActive: {
    borderColor: colors.safe, backgroundColor: colors.safeDim,
  },
  pathToggleText: { color: colors.textMuted, fontSize: 11, fontWeight: '600' },
  pathToggleTextActive: { color: colors.safe },
  safeFab: {
    position: 'absolute', bottom: 24, left: 20,
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.surface, justifyContent: 'center',
    alignItems: 'center', borderWidth: 1, borderColor: colors.border,
    zIndex: 100,
  },
  // ── NEW STYLES FOR EMERGENCY MODULE ──
  floatingSOS: {
    position: 'absolute',
    bottom: 0, 
    right: 0,
    zIndex: 999,
    transform: [{ scale: 0.75 }], // Scales the 160px button down to ~120px so it fits the map
  },
  activeSOSContainer: {
    ...StyleSheet.absoluteFillObject, // Covers the whole map
    backgroundColor: 'rgba(13, 13, 13, 0.95)', // 95% opacity black overlay
    zIndex: 9999, // Stays above everything, including the legend
    justifyContent: 'center',
  }
});

export default MapScreen;