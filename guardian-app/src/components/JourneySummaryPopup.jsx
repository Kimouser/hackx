import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, Animated, ScrollView } from 'react-native';
import colors from '../theme/colors';

const JourneySummaryPopup = ({ summary, loading, onRefresh }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [animation] = useState(new Animated.Value(0));

  if (!summary) return null;

  const toggleExpanded = () => {
    const toValue = isExpanded ? 0 : 1;
    Animated.spring(animation, {
      toValue,
      useNativeDriver: false,
      tension: 50,
      friction: 7,
    }).start();
    setIsExpanded(!isExpanded);
  };

  const expandedHeight = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [60, 320], // collapsed height vs expanded height
  });

  const contentOpacity = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  return (
    <Animated.View style={[styles.popup, { height: expandedHeight }]}>
      {/* Collapsed Header - Always Visible */}
      <TouchableOpacity style={styles.collapsedHeader} onPress={toggleExpanded}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>🗺️</Text>
        </View>
        <Text style={styles.collapsedTitle}>Journey Preview</Text>
        <TouchableOpacity style={styles.expandButton} onPress={toggleExpanded}>
          <Text style={styles.expandIcon}>{isExpanded ? '−' : '+'}</Text>
        </TouchableOpacity>
      </TouchableOpacity>

      {/* Expanded Content - Animated with ScrollView */}
      <Animated.View style={[styles.expandedContent, { opacity: contentOpacity }]}>
        <ScrollView 
          scrollEnabled={isExpanded} 
          nestedScrollEnabled={true}
          showsVerticalScrollIndicator={true}
          scrollIndicatorInsets={{ right: 0 }}
          style={styles.scrollableContent}
        >
          <View style={styles.headerRow}>
            <Text style={styles.heading}>Route Analysis</Text>
            <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
              {loading ? (
                <ActivityIndicator size="small" color={colors.safe} />
              ) : (
                <Text style={styles.refreshLabel}>⟳</Text>
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
        </ScrollView>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  popup: {
    position: 'absolute',
    top: 86,
    right: 16,
    width: 280, // Fixed width for better UX
    backgroundColor: '#111111cc',
    borderColor: colors.safe,
    borderWidth: 1,
    borderRadius: 18,
    zIndex: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 12,
    overflow: 'hidden', // Important for smooth animation
  },
  collapsedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    height: 60,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.safe,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 16,
  },
  collapsedTitle: {
    flex: 1,
    color: colors.safe,
    fontSize: 14,
    fontWeight: '700',
  },
  expandButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  expandIcon: {
    color: colors.safe,
    fontSize: 16,
    fontWeight: 'bold',
  },
  expandedContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  scrollableContent: {
    flex: 1,
    paddingHorizontal: 0,
    paddingTop: 8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  heading: {
    color: colors.safe,
    fontSize: 15,
    fontWeight: '800',
  },
  refreshButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  refreshLabel: {
    color: colors.safe,
    fontSize: 14,
    fontWeight: 'bold',
  },
  sectionTitle: {
    color: colors.safeLight,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 8,
    paddingHorizontal: 16,
  },
  sectionText: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    paddingHorizontal: 16,
  },
  adviceLabel: {
    color: colors.safe,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 10,
    paddingHorizontal: 16,
  },
  adviceText: {
    color: colors.textPrimary,
    fontSize: 13,
    lineHeight: 18,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
});

export default JourneySummaryPopup;
