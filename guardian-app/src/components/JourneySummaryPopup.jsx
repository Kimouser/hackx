import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import colors from '../theme/colors';

const JourneySummaryPopup = ({ summary, loading, onRefresh }) => {
  if (!summary) return null;

  return (
    <View style={styles.popup}>
      <View style={styles.headerRow}>
        <Text style={styles.heading}>Journey Preview</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
          {loading ? (
            <ActivityIndicator size="small" color={colors.safe} />
          ) : (
            <Text style={styles.refreshLabel}>Refresh</Text>
          )}
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Overall</Text>
      <Text style={styles.sectionText}>{summary.overall}</Text>

      <Text style={styles.sectionTitle}>Road / Plot Holes</Text>
      <Text style={styles.sectionText}>{summary.plotHoles}</Text>

      <Text style={styles.sectionTitle}>Street Lights</Text>
      <Text style={styles.sectionText}>{summary.streetLights}</Text>

      <Text style={styles.sectionTitle}>Localities</Text>
      <Text style={styles.sectionText}>{summary.localities}</Text>

      <Text style={styles.sectionTitle}>Busyness</Text>
      <Text style={styles.sectionText}>{summary.busyness}</Text>

      <Text style={styles.adviceLabel}>Advice</Text>
      <Text style={styles.adviceText}>{summary.advice}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  popup: {
    position: 'absolute',
    top: 86,
    left: 16,
    right: 16,
    backgroundColor: '#111111cc',
    borderColor: colors.safe,
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    zIndex: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 12,
    gap: 8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  heading: {
    color: colors.safe,
    fontSize: 15,
    fontWeight: '800',
  },
  refreshButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
  },
  refreshLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  sectionTitle: {
    color: colors.safeLight,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 8,
  },
  sectionText: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
  adviceLabel: {
    color: colors.safe,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 10,
  },
  adviceText: {
    color: colors.textPrimary,
    fontSize: 13,
    lineHeight: 18,
  },
});

export default JourneySummaryPopup;
