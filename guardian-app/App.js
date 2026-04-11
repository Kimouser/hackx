/**
 * App.js - Project Guardian
 * Entry point: Handles SQLite initialization, Demo Seeding, and SOS Provider.
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Navigation & Theme
import AppNavigator from './src/navigation/AppNavigator';
import colors from './src/theme/colors';

// Database & Seeding Logic
import { setupDatabase } from './src/db/database';
import { initMockData } from './src/db/seed';

// Emergency Module Integration
import { SOSProvider } from './src/modules/emergency';

// ─── DEMO CONFIGURATION ──────────────────────────────────────────────────
// Tailored for Falgun's Project Guardian Demo
const CURRENT_USER = { name: 'Falgun' }; 
const EMERGENCY_CONTACTS = [
  { name: 'Mom', phone: '+91XXXXXXXXXX' },
  { name: 'Emergency Services', phone: '1091' },
];
// ───────────────────────────────────────────────────────────────────────────

export default function App() {
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    const prepareApp = async () => {
      try {
        console.log('[Guardian] Booting safety systems...');
        
        // 1. Initialize SQLite Tables
        await setupDatabase();
        
        // 2. Wipe & Seed Mock Data (Mumbai Grid)
        // Note: We run this every boot during the hackathon to ensure 
        // the map icons (Hospitals, Fire, etc.) are always visible.
        await initMockData();
        
        console.log('[Guardian] Safety grid initialized & Seeded with Mumbai landmarks');
      } catch (error) {
        console.error('[Guardian] Fatal initialization error:', error);
      } finally {
        // Keeps splash visible for 1.5s for a professional feel
        setTimeout(() => setDbReady(true), 1500);
      }
    };

    prepareApp();
  }, []);

  // ─── LOADING SCREEN (SPLASH) ───
  if (!dbReady) {
    return (
      <View style={styles.splash}>
        <View style={styles.splashContent}>
          <Text style={styles.splashIcon}>🛡️</Text>
          <Text style={styles.splashTitle}>Project Guardian</Text>
          <ActivityIndicator size="large" color={colors.safe || '#06d6a0'} style={{ marginTop: 20 }} />
          <Text style={styles.splashSub}>Initializing safety database...</Text>
        </View>
        <StatusBar style="light" />
      </View>
    );
  }

  // ─── MAIN APPLICATION ───
  return (
    <SafeAreaProvider>
      <SOSProvider user={CURRENT_USER} contacts={EMERGENCY_CONTACTS}>
        <StatusBar style="light" />
        <AppNavigator />
      </SOSProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  splash: { 
    flex: 1, 
    backgroundColor: colors.bg || '#080810', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  splashContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashIcon: { 
    fontSize: 80, 
    marginBottom: 16,
    // Add shadow/glow for demo pop
    textShadowColor: 'rgba(6, 214, 160, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  splashTitle: { 
    fontSize: 32, 
    fontWeight: '900', 
    color: colors.safe || '#06d6a0', 
    letterSpacing: 1.5,
    textTransform: 'uppercase'
  },
  splashSub: { 
    color: colors.textMuted || '#504d6a', 
    fontSize: 14, 
    marginTop: 15,
    letterSpacing: 1,
    fontStyle: 'italic'
  },
});