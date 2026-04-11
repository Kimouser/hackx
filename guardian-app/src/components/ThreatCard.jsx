import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import colors from '../theme/colors';

const severityColors = {
  low: colors.safe,
  medium: colors.warning,
  high: '#ff8800',
  critical: colors.threat,
};

const categoryLabels = {
  harassment: '⚠️ Harassment',
  broken_light: '💡 Broken Light',
  unsafe_area: '🚧 Unsafe Area',
  unresponsive_police: '🚔 Unresponsive Police',
  other: '📌 Other',
};

const ThreatCard = ({ report, onUpvote, voted = false }) => {
  const sevColor = severityColors[report.severity] || colors.warning;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={[styles.badge, { backgroundColor: sevColor }]}>
          <Text style={styles.badgeText}>{report.severity?.toUpperCase()}</Text>
        </View>
        <Text style={styles.category}>
          {categoryLabels[report.category] || report.category}
        </Text>
        {report.municipal_email_sent ? (
          <View style={styles.municipalBadge}>
            <Text style={styles.municipalText}>📧 Notified</Text>
          </View>
        ) : null}
      </View>

      <Text style={styles.title}>{report.title}</Text>
      {report.description ? (
        <Text style={styles.desc} numberOfLines={2}>{report.description}</Text>
      ) : null}

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.upvoteBtn, voted && styles.upvoteBtnVoted]}
          onPress={() => onUpvote?.(report.id)}
        >
          <Text style={[styles.upvoteArrow, voted && styles.votedText]}>
            {voted ? '✓' : '▲'}
          </Text>
          <Text style={[styles.upvoteCount, voted && styles.votedText]}>
            {report.upvotes}
          </Text>
        </TouchableOpacity>

        <Text style={styles.time}>
          {report.created_at ? new Date(report.created_at).toLocaleDateString() : ''}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  badgeText: {
    color: '#000',
    fontSize: 10,
    fontWeight: '800',
  },
  category: {
    color: colors.textMuted,
    fontSize: 12,
  },
  municipalBadge: {
    backgroundColor: colors.warningDim,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 'auto',
  },
  municipalText: {
    color: colors.warning,
    fontSize: 10,
    fontWeight: '600',
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  desc: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  upvoteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.accentDim,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 6,
  },
  upvoteArrow: {
    color: colors.safe,
    fontSize: 14,
    fontWeight: 'bold',
  },
  upvoteCount: {
    color: colors.safe,
    fontSize: 14,
    fontWeight: '700',
  },
  upvoteBtnVoted: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: colors.border,
  },
  votedText: {
    color: colors.textMuted,
  },
  time: {
    color: colors.textMuted,
    fontSize: 11,
  },
});

export default ThreatCard;
