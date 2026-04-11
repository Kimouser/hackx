import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
} from 'react-native';
import colors from '../theme/colors';

// Mock user data - in production this would come from context/state
const CURRENT_USER = {
  name: 'Falgun',
  email: 'falgun@example.com',
  phone: '+91 98765 43210',
  aadhar: 'XXXX XXXX XXXX 1234',
  area: 'Ahmedabad, Gujarat',
  joinDate: 'January 2024',
  reportsSubmitted: 12,
  upvotesReceived: 45,
};

const ProfileScreen = ({ navigation }) => {
  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: () => navigation.navigate('Auth') },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* Profile Header */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{CURRENT_USER.name.charAt(0)}</Text>
        </View>
        <Text style={styles.name}>{CURRENT_USER.name}</Text>
        <Text style={styles.email}>{CURRENT_USER.email}</Text>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.stat}>
          <Text style={styles.statNumber}>{CURRENT_USER.reportsSubmitted}</Text>
          <Text style={styles.statLabel}>Reports</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statNumber}>{CURRENT_USER.upvotesReceived}</Text>
          <Text style={styles.statLabel}>Upvotes</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statNumber}>{CURRENT_USER.joinDate.split(' ')[1]}</Text>
          <Text style={styles.statLabel}>Member</Text>
        </View>
      </View>

      {/* Contact Details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Contact Details</Text>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>📱 Phone</Text>
          <Text style={styles.detailValue}>{CURRENT_USER.phone}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>📧 Email</Text>
          <Text style={styles.detailValue}>{CURRENT_USER.email}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>🆔 Aadhar</Text>
          <Text style={styles.detailValue}>{CURRENT_USER.aadhar}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>📍 Area</Text>
          <Text style={styles.detailValue}>{CURRENT_USER.area}</Text>
        </View>
      </View>

      {/* Logout */}
      <View style={styles.logoutContainer}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    alignItems: 'center',
    padding: 30,
    backgroundColor: colors.surface,
    margin: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.safe,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.bg,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  stat: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    minWidth: 80,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.safe,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '600',
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  detailLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  actionIcon: {
    fontSize: 20,
    width: 30,
    textAlign: 'center',
  },
  actionText: {
    flex: 1,
    fontSize: 16,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  actionArrow: {
    fontSize: 18,
    color: colors.textMuted,
  },
  logoutContainer: {
    marginHorizontal: 20,
    marginBottom: 40,
  },
  logoutButton: {
    backgroundColor: colors.threat,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default ProfileScreen;