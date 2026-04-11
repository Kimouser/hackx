import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Navigation & Theme
import AppNavigator from './src/navigation/AppNavigator';
import colors from './src/theme/colors';

// Database & Seeding
import { setupDatabase } from './src/db/database';
import { initMockData } from './src/db/seed';

// Emergency Module Integration
import { SOSProvider } from './src/modules/emergency';

// ─── DEMO CONFIGURATION ──────────────────────────────────────────────────
const CURRENT_USER = { name: 'Falgun' }; 
const EMERGENCY_CONTACTS = [
  { name: 'Mom', phone: '+91XXXXXXXXXX' },
  { name: 'Rahul', phone: '+91XXXXXXXXXX' },
];
// ───────────────────────────────────────────────────────────────────────────

export default function App() {
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    const prepareApp = async () => {
      try {
        console.log('[Guardian] Initializing safety grid...');
        
        // 1. Setup SQLite tables
        await setupDatabase();
        
        // 2. Run the Seed (Wipes old data and inserts fresh Mumbai landmarks)
        // We run this every boot during the hackathon to ensure the map is populated
        await initMockData();
        
        console.log('[Guardian] Database initialized & Seeded with Mumbai Data');
      } catch (error) {
        console.error('[Guardian] Initialization error:', error);
      } finally {
        // Short delay to ensure the splash screen is visible for the demo vibe
        setTimeout(() => setDbReady(true), 1000);
      }
    };

    prepareApp();
  }, []);

  // ─── LOADING SCREEN (SPLASH) ───
  if (!dbReady) {
    return (
      <View style={styles.splash}>
        <Text style={styles.splashIcon}>🛡️</Text>
        <Text style={styles.splashTitle}>Project Guardian</Text>
        <ActivityIndicator size="large" color={colors.safe} style={{ marginTop: 20 }} />
        <Text style={styles.splashSub}>Initializing safety database...</Text>
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
  splashIcon: { fontSize: 80, marginBottom: 12 },
  splashTitle: { 
    fontSize: 28, 
    fontWeight: '800', 
    color: colors.safe || '#06d6a0', 
    letterSpacing: 0.5 
  },
  splashSub: { 
    color: colors.textMuted || '#504d6a', 
    fontSize: 13, 
    marginTop: 12 
  },
});