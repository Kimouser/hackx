import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import colors from '../theme/colors';
import LeafletMap from '../components/LeafletMap';
import PanicButton from '../components/PanicButton';
import { getMapOverlay } from '../db/database';
import { AHMEDABAD } from '../utils/location';

// Mock "Safe Paths" - pre-defined safe walking routes in Ahmedabad
const SAFE_PATHS = [
  {
    coords: [
      [23.0305, 72.5653], // Ellisbridge Police Station
      [23.0310, 72.5600],
      [23.0325, 72.5560], // CG Road
      [23.0330, 72.5570], // Starbucks
      [23.0365, 72.5463], // Gujarat University
    ],
  },
  {
    coords: [
      [23.0242, 72.5720], // VS Hospital
      [23.0258, 72.5714],
      [23.0225, 72.5714], // Center
      [23.0195, 72.5680],
      [23.0140, 72.5680], // Apollo Pharmacy
    ],
  },
  {
    coords: [
      [23.0380, 72.5580], // Navrangpura Fire Station
      [23.0350, 72.5560],
      [23.0330, 72.5570], // Starbucks CG Road
      [23.0305, 72.5653], // Ellisbridge Police
    ],
  },
];

const MapScreen = () => {
  const [threats, setThreats] = useState([]);
  const [safeZones, setSafeZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSafePaths, setShowSafePaths] = useState(true);

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
  }, [loadData]);

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
      />

      {/* Panic Button overlay */}
      <PanicButton />

      {/* Safe spaces FAB */}
      <TouchableOpacity style={styles.safeFab} onPress={loadData}>
        <Text style={styles.safeFabText}>🔄</Text>
      </TouchableOpacity>
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
  safeFabText: { fontSize: 20 },
});

export default MapScreen;
