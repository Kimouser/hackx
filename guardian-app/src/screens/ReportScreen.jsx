import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ScrollView, KeyboardAvoidingView, Platform, Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
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

const ReportScreen = ({ navigation }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [severity, setSeverity] = useState('medium');
  const [submitting, setSubmitting] = useState(false);
  const [photoUri, setPhotoUri] = useState(null);

  const handleSubmit = async () => {
    console.log('[ReportScreen] Submit pressed');
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
      console.log('[ReportScreen] Creating report with:', { title, description, category, severity, photoUri });
      const reportId = await createReport({
        title: title.trim(),
        description: description.trim(),
        category,
        severity,
        latitude: AHMEDABAD.latitude + (Math.random() - 0.5) * 0.02,
        longitude: AHMEDABAD.longitude + (Math.random() - 0.5) * 0.02,
        imageUri: photoUri,
      });

      console.log('[ReportScreen] Report created with ID:', reportId);

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
        [{ text: 'View on Dashboard', onPress: () => {
          console.log('[ReportScreen] Navigating to Dashboard');
          navigation.navigate('Dashboard');
        }}]
      );

      // Reset form
      setTitle('');
      setDescription('');
      setCategory('');
      setSeverity('medium');
      setPhotoUri(null);
    } catch (error) {
      console.error('[ReportScreen] Submit error:', error);
      Alert.alert('Error', 'Failed to submit report: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddPhoto = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Camera roll permission is required to add photos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick photo: ' + error.message);
    }
  };

  const pickPhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Camera permission is required to take photos.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      if (!result.canceled) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to capture photo: ' + error.message);
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

        {/* Photo Capture */}
        <Text style={styles.label}>Photo Evidence</Text>
        <View style={styles.photoContainer}>
          {photoUri ? (
            <>
              <Image source={{ uri: photoUri }} style={styles.photoPreview} />
              <TouchableOpacity style={styles.removePhotoBtn} onPress={() => setPhotoUri(null)}>
                <Text style={styles.removePhotoText}>✕ Remove Photo</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity style={styles.photoBtn} onPress={handleAddPhoto}>
              <Text style={styles.photoBtnIcon}>📸</Text>
              <Text style={styles.photoBtnText}>Add Photo</Text>
            </TouchableOpacity>
          )}
        </View>

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
          style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
          activeOpacity={submitting ? 1 : 0.7}
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
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitText: { color: colors.bg, fontSize: 16, fontWeight: '700' },
  photoContainer: { marginTop: 10 },
  photoBtn: {
    backgroundColor: colors.safe, borderRadius: 8, padding: 14, alignItems: 'center', justifyContent: 'center',
  },
  photoBtnIcon: { fontSize: 24, marginBottom: 4 },
  photoBtnText: { color: colors.bg, fontSize: 14, fontWeight: '600' },
  photoPreview: { width: '100%', height: 200, borderRadius: 10, marginBottom: 10 },
  removePhotoBtn: {
    backgroundColor: colors.threat, borderRadius: 8, padding: 12, alignItems: 'center',
  },
  removePhotoText: { color: colors.bg, fontSize: 13, fontWeight: '600' },
});

export default ReportScreen;
