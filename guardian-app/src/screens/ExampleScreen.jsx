/**
 * ExampleScreen.jsx
 * Project Guardian – Integration Example
 * * Path: src/screens/ExampleScreen.jsx
 */

import React from 'react';
import { SafeAreaView, Text, View, StyleSheet } from 'react-native';

// ── FIXED MODULE IMPORT ──────────────────────────────────────────────────────
// We use '../' to go up from 'screens' to 'src', then into 'modules/emergency'
import { SOSProvider, PanicButton, useSOS, SOS_STATE } from '../modules/emergency';

// ─── App-level config (Ahmedabad Demo Context) ────────────────────────────

const CURRENT_USER = { name: 'Falgun' }; //

const EMERGENCY_CONTACTS = [
  { name: 'Mom',         phone: '+91XXXXXXXXXX' },
  { name: 'Rahul (Friend)', phone: '+91XXXXXXXXXX' },
];

// ─── Status Bar Component (consumes useSOS) ───────────────────────────────────

function SOSStatusBar() {
  const { sosState, countdown, nmeaPayload } = useSOS();

  if (sosState === SOS_STATE.IDLE) return null;

  return (
    <View style={styles.statusBarContainer}>
      <Text style={styles.statusTitle}>
        ● GUARDIAN ACTIVE – {sosState.replace('_', ' ')}
      </Text>

      {sosState === SOS_STATE.AWAITING_CHECK && (
        <Text style={styles.statusSub}>
          Escalating in {countdown}s unless you confirm safe.
        </Text>
      )}

      {/* Debug: show NMEA strings for Pixhawk GPS logic */}
      {nmeaPayload.gga ? (
        <Text style={styles.nmeaDebug}>
          {nmeaPayload.frozen ? '⚠️ FROZEN  ' : '📡 LIVE  '}
          {nmeaPayload.gga}
        </Text>
      ) : (
        <Text style={styles.nmeaDebug}>Acquiring GPS fix for NMEA payload…</Text>
      )}
    </View>
  );
}

// ─── Main Screen Component ────────────────────────────────

function GuardianTestContent() {
  const { sosState, resetSOS } = useSOS();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>🛡️ Guardian SOS Test</Text>
        <Text style={styles.subtitle}>Test module for NMEA & Escalation logic</Text>
      </View>

      {/* Status bar – visible only when SOS is active */}
      <SOSStatusBar />

      {/* Main SOS area */}
      <View style={styles.buttonArea}>
        <PanicButton
          onBeforeSOSTrigger={() => {
            console.log('[Guardian] SOS long-press threshold reached');
          }}
        />
      </View>

      {/* Dev reset button */}
      {sosState !== SOS_STATE.IDLE && (
        <View style={styles.footer}>
          <Text
            style={styles.resetText}
            onPress={resetSOS}
          >
            [DEV] Reset SOS State
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

// ─── Root export ───────────────────────────────────────

export default function ExampleScreen() {
  return (
    <SOSProvider user={CURRENT_USER} contacts={EMERGENCY_CONTACTS}>
      <GuardianTestContent />
    </SOSProvider>
  );
}

// ─── Styles ───────────────────────────────────────────
// Using StyleSheet for maximum compatibility with your dark theme

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d0d0d', // Matches colors.bg
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 20,
  },
  title: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  subtitle: {
    color: '#666666',
    fontSize: 14,
    marginTop: 4,
  },
  statusBarContainer: {
    backgroundColor: '#1a0000',
    borderWidth: 1,
    borderColor: '#ff3333',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 24,
  },
  statusTitle: {
    color: '#ff6666',
    fontWeight: 'bold',
    fontSize: 12,
    letterSpacing: 1,
    marginBottom: 4,
  },
  statusSub: {
    color: '#cccccc',
    fontSize: 12,
  },
  nmeaDebug: {
    color: '#444444',
    fontSize: 10,
    marginTop: 10,
    fontFamily: 'monospace',
  },
  buttonArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    paddingBottom: 40,
    alignItems: 'center',
  },
  resetText: {
    color: '#444444',
    fontSize: 12,
    textDecorationLine: 'underline',
  },
});