/**
 * ExampleScreen.jsx
 * Project Guardian – Integration Example
 *
 * Shows exactly how to wire the emergency module into a real Expo screen.
 * This file is NOT part of the module – place it in your screens/ folder.
 *
 * Prerequisites (add to package.json / install):
 *   npx expo install expo-location expo-haptics react-native-svg
 *   npm install nativewind
 *
 * Also add to app.json plugins:
 *   ["expo-location", { "locationAlwaysAndWhenInUsePermission": "Guardian needs your location for emergency SOS." }]
 */

import React from 'react';
import { SafeAreaView, Text, View } from 'react-native';

// ── Module imports ────────────────────────────────────────────────────────────
import { SOSProvider, PanicButton, useSOS, SOS_STATE } from 'src/modules/emergency';

// ─── App-level config (replace with your real data / auth context) ────────────

const CURRENT_USER = { name: 'Priya Sharma' };

const EMERGENCY_CONTACTS = [
  { name: 'Mom',         phone: '+919876543210' },
  { name: 'Rahul (Friend)', phone: '+919123456789' },
];

// ─── Status Bar Component (consumes useSOS) ───────────────────────────────────

function SOSStatusBar() {
  const { sosState, countdown, nmeaPayload } = useSOS();

  if (sosState === SOS_STATE.IDLE) return null;

  return (
    <View className="bg-[#1a0000] border border-[#ff3333] rounded-xl p-4 mx-4 mb-6">
      <Text className="text-[#ff6666] font-bold text-xs tracking-widest mb-1">
        ● GUARDIAN ACTIVE – {sosState.replace('_', ' ')}
      </Text>

      {sosState === SOS_STATE.AWAITING_CHECK && (
        <Text className="text-neutral-300 text-xs">
          Escalating in {countdown}s unless you confirm safe.
        </Text>
      )}

      {/* Debug: show NMEA strings */}
      {nmeaPayload.gga ? (
        <Text className="text-neutral-600 text-[10px] mt-2 font-mono">
          {nmeaPayload.frozen ? '⚠️ FROZEN  ' : '📡 LIVE  '}
          {nmeaPayload.gga}
        </Text>
      ) : (
        <Text className="text-neutral-600 text-[10px] mt-2">Acquiring GPS fix…</Text>
      )}
    </View>
  );
}

// ─── Inner Screen (must be inside SOSProvider) ────────────────────────────────

function GuardianScreen() {
  const { sosState, resetSOS, SOS_STATE } = useSOS();

  return (
    <SafeAreaView className="flex-1 bg-[#0d0d0d]">
      {/* Header */}
      <View className="px-6 pt-6 pb-4">
        <Text className="text-white text-2xl font-bold tracking-wide">🛡️ Guardian</Text>
        <Text className="text-neutral-500 text-sm mt-1">Your personal safety companion</Text>
      </View>

      {/* Status bar – visible only when SOS is active */}
      <SOSStatusBar />

      {/* Main SOS area */}
      <View className="flex-1 items-center justify-center">
        <PanicButton
          onBeforeSOSTrigger={() => {
            console.log('SOS about to fire – log analytics event here');
          }}
        />
      </View>

      {/* Dev reset button (remove in production) */}
      {sosState !== SOS_STATE.IDLE && (
        <View className="pb-10 items-center">
          <Text
            className="text-neutral-600 text-xs underline"
            onPress={resetSOS}
          >
            [DEV] Reset SOS state
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

// ─── Root export (wraps with Provider) ───────────────────────────────────────

export default function App() {
  return (
    <SOSProvider user={CURRENT_USER} contacts={EMERGENCY_CONTACTS}>
      <GuardianScreen />
    </SOSProvider>
  );
}

/*
 * ── Webhook Integration Notes ─────────────────────────────────────────────────
 *
 * To handle contact replies ("YES" / "NO") in production:
 *
 * 1. Set up a Twilio webhook that POSTs to your backend when an SMS is received.
 * 2. Your backend pushes a notification to the device (FCM/APNs).
 * 3. In the notification handler, call:
 *
 *     import { emergencyService } from 'src/modules/emergency';
 *
 *     // If ANY contact responds NO:
 *     emergencyService.receiveContactNoResponse();
 *
 *     // If a contact responds YES AND the user confirms safe via the app:
 *     emergencyService.confirmSafe();   // or let the UI button do it
 *
 * ── Background Location ───────────────────────────────────────────────────────
 *
 * For production, add expo-task-manager + expo-location background task so the
 * LocationService keeps updating even when the screen is off.
 * See: https://docs.expo.dev/versions/latest/sdk/location/#background-location-methods
 */
