import React, { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View, Text, StyleSheet, FlatList, RefreshControl, Alert, TouchableOpacity,
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
      setReports(data);
    } catch (error) {
      console.error('Failed to load reports:', error);
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

      if (result.municipalTriggered) {
        // Municipal Loop activated!
        await sendMunicipalEmail(result);
        Alert.alert(
          '📧 Municipal Loop Activated!',
          `This report has reached 10+ upvotes.\n\nAn automated email has been sent to the Ahmedabad Municipal Corporation.\n\nCheck the console for the email content.`,
          [{ text: 'Great!' }]
        );
      }

      loadReports();
    } catch (error) {
      console.log('Upvote error:', error);
    }
  };

  const activeCount = reports.filter((r) => r.status === 'active').length;
  const escalatedCount = reports.filter((r) => r.status !== 'active').length;

  const filteredReports = filter === 'all' ? reports : filter === 'active' ? reports.filter(r => r.status === 'active') : reports.filter(r => r.status !== 'active');

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.heading}>Priority Poll</Text>
        <Text style={styles.sub}>
          Upvote issues to escalate them to the Municipal Corporation
        </Text>

        {/* Stats */}
        <View style={styles.stats}>
          <TouchableOpacity style={[styles.stat, filter === 'all' && styles.selectedStat]} onPress={() => setFilter('all')}>
            <Text style={styles.statNum}>{reports.length}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.stat, { borderColor: colors.warning }, filter === 'active' && styles.selectedStat]} onPress={() => setFilter('active')}>
            <Text style={[styles.statNum, { color: colors.warning }]}>{activeCount}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.stat, { borderColor: colors.safe }, filter === 'escalated' && styles.selectedStat]} onPress={() => setFilter('escalated')}>
            <Text style={[styles.statNum, { color: colors.safe }]}>{escalatedCount}</Text>
            <Text style={styles.statLabel}>Escalated</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Report List */}
      <FlatList
        data={filteredReports}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <ThreatCard report={item} onUpvote={handleUpvote} />
        )}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadReports} tintColor={colors.safe} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyText}>No reports yet</Text>
            <Text style={styles.emptySub}>
              Reports will appear here automatically on first launch.
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { padding: 20, paddingBottom: 12 },
  heading: { fontSize: 22, fontWeight: '700', color: colors.textPrimary },
  sub: { fontSize: 13, color: colors.textSecondary, marginTop: 4 },
  stats: {
    flexDirection: 'row', gap: 10, marginTop: 14,
  },
  stat: {
    flex: 1, alignItems: 'center', paddingVertical: 10,
    backgroundColor: colors.surface, borderRadius: 10,
    borderWidth: 1, borderColor: colors.border,
  },
  selectedStat: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  statNum: { fontSize: 22, fontWeight: '700', color: colors.textPrimary },
  statLabel: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  list: { padding: 16, paddingTop: 4 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { color: colors.textSecondary, fontSize: 16 },
  emptySub: { color: colors.textMuted, fontSize: 12, marginTop: 4, textAlign: 'center' },
});

export default DashboardScreen;
