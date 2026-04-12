import React, { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View, Text, StyleSheet, FlatList, RefreshControl, Alert, TouchableOpacity, Image,
} from 'react-native';
import colors from '../theme/colors';
import ThreatCard from '../components/ThreatCard';
import { getAllReports, upvoteReport } from '../db/database';
import { sendMunicipalEmail } from '../services/municipalService';

const DashboardScreen = () => {
  const [reports, setReports] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');

  const loadReports = useCallback(async () => {
    setRefreshing(true);
    try {
      const data = await getAllReports();
      // Ensure we handle cases where data might be undefined
      setReports(data || []);
    } catch (error) {
      console.error('Failed to load reports from Supabase:', error);
    }
    setRefreshing(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadReports();
    }, [loadReports])
  );

  const handleUpvote = async (id) => {
    try {
      const result = await upvoteReport(id);

      // --- MUNICIPAL LOOP TRIGGER ---
      // We trigger the email exactly when it hits 10 upvotes
      if (result.upvotes === 10) {
        try {
          await sendMunicipalEmail(result);
          Alert.alert(
            '📧 Municipal Loop Activated!',
            `This report has reached 10+ upvotes.\n\nAn automated report has been escalated to the Municipal Corporation.`,
            [{ text: 'Great!' }]
          );
        } catch (emailErr) {
          console.error("Municipal email failed to send:", emailErr);
        }
      }

      // Refresh the list to show new upvote count
      loadReports();
    } catch (error) {
      console.log('Upvote error:', error);
    }
  };

  // Helper stats
  const activeCount = reports.filter((r) => r.status === 'active').length;
  const escalatedCount = reports.filter((r) => r.status !== 'active').length;
  
  // Gallery logic for crawler/community images
  const reportsWithPhotos = reports
    .filter((r) => r.image_uri && r.image_uri.trim() !== '')
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const filteredReports = filter === 'all' 
    ? reports 
    : filter === 'active' 
      ? reports.filter(r => r.status === 'active') 
      : reports.filter(r => r.status !== 'active');

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.heading}>Community Dashboard</Text>
        <Text style={styles.sub}>
          Live safety feed from across the city. Upvote to escalate.
        </Text>

        {/* Stats Grid */}
        <View style={styles.stats}>
          <TouchableOpacity 
            style={[styles.stat, filter === 'all' && styles.selectedStat]} 
            onPress={() => setFilter('all')}
          >
            <Text style={styles.statNum}>{reports.length}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.stat, { borderColor: colors.warning }, filter === 'active' && styles.selectedStat]} 
            onPress={() => setFilter('active')}
          >
            <Text style={[styles.statNum, { color: colors.warning }]}>{activeCount}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.stat, { borderColor: colors.safe }, filter === 'escalated' && styles.selectedStat]} 
            onPress={() => setFilter('escalated')}
          >
            <Text style={[styles.statNum, { color: colors.safe }]}>{escalatedCount}</Text>
            <Text style={styles.statLabel}>Escalated</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Photo Gallery (Only shows if crawler found images) */}
      {reportsWithPhotos.length > 0 && (
        <View style={styles.photoSection}>
          <View style={styles.photoHeaderRow}>
            <Text style={styles.photoSectionTitle}>📸 Live Sightings</Text>
            <Text style={styles.photoSectionSub}>{reportsWithPhotos.length} images</Text>
          </View>
          <FlatList
            data={reportsWithPhotos}
            keyExtractor={(item) => String(item.id)}
            horizontal
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.photoItem} onPress={() => {
                Alert.alert(item.title, item.description || 'No further details.');
              }}>
                <Image source={{ uri: item.image_uri }} style={styles.photoThumbnail} />
                <View style={styles.photoOverlay}>
                  <Text style={styles.photoTitle} numberOfLines={1}>{item.title}</Text>
                  <Text style={styles.photoUpvotes}>▲ {item.upvotes}</Text>
                </View>
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.photoList}
          />
        </View>
      )}

      {/* Main Priority List */}
      <FlatList
        data={filteredReports}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <ThreatCard report={item} onUpvote={handleUpvote} />
        )}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={loadReports} 
            tintColor={colors.safe} 
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🛰️</Text>
            <Text style={styles.emptyText}>Syncing with Cloud Database...</Text>
            <Text style={styles.emptySub}>
              Ensure your web crawler is running to populate this list.
            </Text>
          </View>
        }
      />
    </View>
  );
};

// Styles remain the same as your provided code
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { padding: 20, paddingBottom: 12 },
  heading: { fontSize: 22, fontWeight: '700', color: colors.textPrimary },
  sub: { fontSize: 13, color: colors.textSecondary, marginTop: 4 },
  stats: { flexDirection: 'row', gap: 10, marginTop: 14 },
  stat: {
    flex: 1, alignItems: 'center', paddingVertical: 10,
    backgroundColor: colors.surface, borderRadius: 10,
    borderWidth: 1, borderColor: colors.border,
  },
  selectedStat: { backgroundColor: colors.accent, borderColor: colors.accent },
  statNum: { fontSize: 22, fontWeight: '700', color: colors.textPrimary },
  statLabel: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  photoSection: { paddingHorizontal: 20, paddingBottom: 16 },
  photoSectionTitle: { fontSize: 16, fontWeight: '600', color: colors.textPrimary },
  photoSectionSub: { fontSize: 12, color: colors.textSecondary },
  photoHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  photoList: { paddingRight: 20 },
  photoItem: { width: 120, height: 120, marginRight: 12, borderRadius: 12, overflow: 'hidden', backgroundColor: colors.surface },
  photoThumbnail: { width: '100%', height: '100%' },
  photoOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0, 0, 0, 0.7)', padding: 8 },
  photoTitle: { color: '#fff', fontSize: 11, fontWeight: '600' },
  photoUpvotes: { color: colors.safe, fontSize: 10, fontWeight: '700', marginTop: 2 },
  list: { padding: 16, paddingTop: 4 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { color: colors.textSecondary, fontSize: 16 },
  emptySub: { color: colors.textMuted, fontSize: 12, marginTop: 4, textAlign: 'center' },
});

export default DashboardScreen;