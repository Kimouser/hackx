import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import colors from '../theme/colors';
import { createReport } from '../db/database';
import { sendMunicipalEmail } from '../services/municipalService';
import { AHMEDABAD } from '../utils/location';

const CATEGORIES = [
  { key: 'harassment', label: 'Harassment', icon: '⚠️' },
  { key: 'broken_light', label: 'Broken Light', icon: '💡' },
  { key: 'unsafe_area', label: 'Unsafe Area', icon: '🚧' },
  { key: 'unresponsive_police', label: 'Unresponsive Police', icon: '🚔' },
  { key: 'other', label: 'Other', icon: '📌' },
];

const SEVERITIES = [
  { key: 'low', color: colors.safe },
  { key: 'medium', color: colors.warning },
  { key: 'high', color: '#ff8800' },
  { key: 'critical', color: colors.threat },
];

const ReportScreen = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [severity, setSeverity] = useState('medium');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Missing Info', 'Please enter a title for the report.');
      return;
    }
    if (!category) {
      Alert.alert('Missing Info', 'Please select a category.');
      return;
    }

    setSubmitting(true);
    try {
      const reportId = await createReport({
        title: title.trim(),
        description: description.trim(),
        category,
        severity,
        latitude: AHMEDABAD.latitude + (Math.random() - 0.5) * 0.02,
        longitude: AHMEDABAD.longitude + (Math.random() - 0.5) * 0.02,
      });

      // Mock Municipal Loop — log the "email" to console
      await sendMunicipalEmail({
        id: reportId,
        title: title.trim(),
        description: description.trim(),
        category,
        severity,
        latitude: AHMEDABAD.latitude,
        longitude: AHMEDABAD.longitude,
        upvotes: 0,
      });

      Alert.alert(
        '✓ Report Submitted',
        'Your report has been saved locally and the Municipal Loop has been notified.\n\nThe community can now upvote this on the Dashboard.',
        [{ text: 'Great!' }]
      );

      // Reset form
      setTitle('');
      setDescription('');
      setCategory('');
      setSeverity('medium');
    } catch (error) {
      Alert.alert('Error', 'Failed to submit report: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.heading}>Report a Safety Issue</Text>
        <Text style={styles.sub}>
          Drop a pin on threats, broken lights, or unsafe areas. Your report is saved locally and shared with the community.
        </Text>

        {/* Title */}
        <Text style={styles.label}>Title *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Broken streetlight near Paldi Circle"
          placeholderTextColor={colors.textMuted}
          value={title}
          onChangeText={setTitle}
        />

        {/* Description */}
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Describe the issue in detail..."
          placeholderTextColor={colors.textMuted}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        {/* Category */}
        <Text style={styles.label}>Category *</Text>
        <View style={styles.chipGrid}>
          {CATEGORIES.map((c) => (
            <TouchableOpacity
              key={c.key}
              style={[styles.chip, category === c.key && styles.chipActive]}
              onPress={() => setCategory(c.key)}
            >
              <Text style={styles.chipIcon}>{c.icon}</Text>
              <Text style={[styles.chipText, category === c.key && styles.chipTextActive]}>
                {c.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Severity */}
        <Text style={styles.label}>Severity</Text>
        <View style={styles.sevRow}>
          {SEVERITIES.map((s) => (
            <TouchableOpacity
              key={s.key}
              style={[
                styles.sevChip,
                severity === s.key && { borderColor: s.color, backgroundColor: s.color + '22' },
              ]}
              onPress={() => setSeverity(s.key)}
            >
              <View style={[styles.sevDot, { backgroundColor: s.color }]} />
              <Text style={[styles.sevText, severity === s.key && { color: s.color }]}>
                {s.key.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Location info */}
        <View style={styles.locationBar}>
          <Text style={styles.locationIcon}>📍</Text>
          <Text style={styles.locationText}>
            Pin: Ahmedabad ({AHMEDABAD.latitude.toFixed(4)}°N, {AHMEDABAD.longitude.toFixed(4)}°E)
          </Text>
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitBtn, submitting && { opacity: 0.5 }]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          <Text style={styles.submitText}>
            {submitting ? 'Submitting...' : '📢 Submit Report'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 20, paddingBottom: 40 },
  heading: { fontSize: 22, fontWeight: '700', color: colors.textPrimary, marginBottom: 4 },
  sub: { fontSize: 13, color: colors.textSecondary, marginBottom: 20, lineHeight: 18 },
  label: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 6, marginTop: 14 },
  input: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: 10, padding: 14, color: colors.textPrimary, fontSize: 15,
  },
  textArea: { minHeight: 100 },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: 8, paddingVertical: 8, paddingHorizontal: 12,
  },
  chipActive: { borderColor: colors.safe, backgroundColor: colors.safeDim },
  chipIcon: { fontSize: 16 },
  chipText: { color: colors.textSecondary, fontSize: 13 },
  chipTextActive: { color: colors.safe, fontWeight: '600' },
  sevRow: { flexDirection: 'row', gap: 8 },
  sevChip: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 5, paddingVertical: 10, borderRadius: 8,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
  },
  sevDot: { width: 8, height: 8, borderRadius: 4 },
  sevText: { fontSize: 10, color: colors.textMuted, fontWeight: '700' },
  locationBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.surface, padding: 12, borderRadius: 8,
    marginTop: 18, borderWidth: 1, borderColor: colors.border,
  },
  locationIcon: { fontSize: 16 },
  locationText: { color: colors.textSecondary, fontSize: 12 },
  submitBtn: {
    backgroundColor: colors.safe, borderRadius: 12,
    padding: 16, alignItems: 'center', marginTop: 20,
  },
  submitText: { color: colors.bg, fontSize: 16, fontWeight: '700' },
});

export default ReportScreen;
