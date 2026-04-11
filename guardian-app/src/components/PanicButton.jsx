import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Alert, Platform } from 'react-native';
import colors from '../theme/colors';
import { logEmergency } from '../db/database';

/**
 * Guardian Bracelet Simulation - Panic / SOS Button
 *
 * Long-press (800ms) to trigger the emergency escalation flow:
 * 1. Vibrate / haptic feedback
 * 2. Log emergency to SQLite
 * 3. Show "Check-in" notification sequence
 * 4. Simulated 5-minute police escalation timer
 */
const PanicButton = () => {
  const [triggered, setTriggered] = useState(false);
  const [step, setStep] = useState(0);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Pulse animation loop
  React.useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  const triggerEscalation = async () => {
    setTriggered(true);

    // Haptic feedback (vibration API — works on mobile & some browsers)
    try {
      if (navigator?.vibrate) navigator.vibrate([100, 200, 100, 200, 100]);
    } catch {
      // Vibration not available
    }

    // Log to SQLite
    try {
      await logEmergency('bracelet_tap', 23.0225, 72.5714);
    } catch (e) {
      console.log('Emergency log error:', e);
    }

    console.log('🚨 GUARDIAN BRACELET TRIGGERED — Emergency escalation started');

    // Simulate escalation steps
    setStep(1);
    setTimeout(() => setStep(2), 1500);
    setTimeout(() => setStep(3), 3000);
    setTimeout(() => {
      setStep(4);
      setTriggered(false);
      setStep(0);
      Alert.alert(
        '✓ Alert Sent',
        'Emergency contacts notified.\nGPS tracking active.\nPolice alert queued (5 min).',
        [{ text: 'OK' }]
      );
    }, 5000);
  };

  const handlePanic = () => {
    if (triggered) return;
    Alert.alert(
      '🚨 Emergency Alert',
      'This will notify your emergency contacts and start GPS tracking.\n\nContinue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'SEND ALERT', style: 'destructive', onPress: triggerEscalation },
      ]
    );
  };

  const STEPS = [
    '',
    '📡 Contacting emergency contacts...',
    '📍 GPS tracking started...',
    '⏱ Police alert in 5:00...',
    '✓ All alerts sent',
  ];

  return (
    <View style={styles.wrapper}>
      {/* Escalation status overlay */}
      {triggered && step > 0 && (
        <View style={styles.statusBar}>
          <Text style={styles.statusText}>{STEPS[step]}</Text>
        </View>
      )}

      {/* SOS Button */}
      <Animated.View style={[styles.ring, { transform: [{ scale: pulseAnim }] }]}>
        <TouchableOpacity
          style={[styles.button, triggered && styles.buttonActive]}
          onLongPress={handlePanic}
          delayLongPress={800}
          activeOpacity={0.7}
        >
          <Text style={styles.icon}>{triggered ? '🚨' : '🆘'}</Text>
          <Text style={styles.label}>{triggered ? 'SENDING...' : 'HOLD SOS'}</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    alignItems: 'flex-end',
    zIndex: 999,
  },
  statusBar: {
    backgroundColor: 'rgba(255, 34, 34, 0.9)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 10,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  ring: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: 'rgba(255, 34, 34, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: colors.panic,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: colors.panic,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 12,
      },
      android: { elevation: 10 },
      web: { boxShadow: '0 4px 20px rgba(255,34,34,0.5)' },
    }),
  },
  buttonActive: {
    backgroundColor: '#ff0000',
  },
  icon: {
    fontSize: 26,
  },
  label: {
    color: '#fff',
    fontSize: 8,
    fontWeight: '800',
    marginTop: 1,
    letterSpacing: 0.5,
  },
});

export default PanicButton;
