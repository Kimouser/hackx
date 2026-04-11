import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Alert, Platform, Pressable } from 'react-native';
import colors from '../theme/colors';
import { logEmergency } from '../db/database';

/**
 * Guardian Bracelet Simulation — SOS Button
 *
 * Minimalist floating button with 3-second long-press activation.
 * Progress ring fills during hold to give visual feedback.
 * Escalation: contacts → GPS → police timer.
 */
const HOLD_DURATION = 3000;

const PanicButton = () => {
  const [triggered, setTriggered] = useState(false);
  const [step, setStep] = useState(0);
  const [holding, setHolding] = useState(false);
  const progress = useRef(new Animated.Value(0)).current;
  const holdTimer = useRef(null);

  useEffect(() => {
    return () => {
      if (holdTimer.current) clearTimeout(holdTimer.current);
    };
  }, []);

  const startHold = () => {
    if (triggered) return;
    setHolding(true);
    progress.setValue(0);

    Animated.timing(progress, {
      toValue: 1,
      duration: HOLD_DURATION,
      useNativeDriver: false,
    }).start();

    holdTimer.current = setTimeout(() => {
      setHolding(false);
      triggerEscalation();
    }, HOLD_DURATION);
  };

  const cancelHold = () => {
    if (holdTimer.current) clearTimeout(holdTimer.current);
    holdTimer.current = null;
    setHolding(false);
    progress.setValue(0);
  };

  const triggerEscalation = async () => {
    setTriggered(true);

    // Haptic feedback
    try {
      if (navigator?.vibrate) navigator.vibrate([100, 200, 100, 200, 100]);
    } catch {}

    // Log emergency
    try {
      await logEmergency('bracelet_tap', 23.0225, 72.5714);
    } catch (e) {
      console.log('Emergency log error:', e);
    }

    console.log('🚨 GUARDIAN BRACELET TRIGGERED — Emergency escalation started');

    // Escalation sequence
    setStep(1);
    setTimeout(() => setStep(2), 1500);
    setTimeout(() => setStep(3), 3000);
    setTimeout(() => {
      setStep(4);
      setTriggered(false);
      setStep(0);
      Alert.alert(
        'Alert Sent',
        'Emergency contacts notified.\nGPS tracking active.\nPolice alert queued (5 min).',
        [{ text: 'OK' }]
      );
    }, 5000);
  };

  const STEPS = [
    '',
    'Contacting emergency contacts...',
    'GPS tracking started...',
    'Police alert in 5:00...',
    'All alerts sent',
  ];

  // Animate progress ring width
  const progressWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.wrapper}>
      {/* Escalation status */}
      {triggered && step > 0 && (
        <View style={styles.statusBar}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>{STEPS[step]}</Text>
        </View>
      )}

      {/* Hold progress bar */}
      {holding && (
        <View style={styles.progressContainer}>
          <Animated.View style={[styles.progressBar, { width: progressWidth }]} />
          <Text style={styles.progressLabel}>Hold to activate...</Text>
        </View>
      )}

      {/* SOS Button — clean circle */}
      <Pressable
        onPressIn={startHold}
        onPressOut={cancelHold}
        style={({ pressed }) => [
          styles.button,
          triggered && styles.buttonActive,
          pressed && !triggered && styles.buttonPressed,
        ]}
      >
        <Text style={styles.label}>{triggered ? 'SOS' : 'SOS'}</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 28,
    right: 20,
    alignItems: 'flex-end',
    zIndex: 999,
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(20, 20, 20, 0.95)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 34, 34, 0.4)',
    gap: 8,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ff2222',
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  progressContainer: {
    width: 140,
    height: 24,
    backgroundColor: 'rgba(20, 20, 20, 0.95)',
    borderRadius: 12,
    marginBottom: 10,
    overflow: 'hidden',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 34, 34, 0.3)',
  },
  progressBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 34, 34, 0.6)',
    borderRadius: 12,
  },
  progressLabel: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
    zIndex: 1,
  },
  button: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#cc0000',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 34, 34, 0.3)',
    ...Platform.select({
      ios: {
        shadowColor: '#ff0000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
      },
      android: { elevation: 8 },
      web: { boxShadow: '0 2px 16px rgba(255,0,0,0.35)' },
    }),
  },
  buttonPressed: {
    backgroundColor: '#ff0000',
    borderColor: 'rgba(255, 34, 34, 0.6)',
  },
  buttonActive: {
    backgroundColor: '#ff0000',
    borderColor: '#ff4444',
  },
  label: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
});

export default PanicButton;
