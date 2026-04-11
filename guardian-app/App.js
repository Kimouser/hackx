import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { getDatabase } from './src/db/database';
import colors from './src/theme/colors';

// ─── STEP 1: ADD TEST TOGGLE ──────────────────────────────────────────
// Set this to true to see the SOS Button. Set to false for your Map.
const TEST_MODE = true; 

import ExampleScreen from './src/screens/ExampleScreen'; 
// ───────────────────────────────────────────────────────────────────────

export default function App() {
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        await getDatabase();
        console.log('[Guardian] Database initialized and seeded');
      } catch (error) {
        console.error('[Guardian] DB init error:', error);
      }
      setDbReady(true);
    };
    init();
  }, []);

  // Keep your splash screen active while DB loads
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

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      
      {/* ─── STEP 2: RENDER SWITCH ─── */}
      {TEST_MODE ? (
        <ExampleScreen />
      ) : (
        <AppNavigator />
      )}
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  splashIcon: { fontSize: 80, marginBottom: 12 },
  splashTitle: {
    fontSize: 28, fontWeight: '800',
    color: colors.safe, letterSpacing: 0.5,
  },
  splashSub: {
    color: colors.textMuted, fontSize: 13, marginTop: 12,
  },
});