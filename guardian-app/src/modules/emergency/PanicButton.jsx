import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  PanResponder,
  Text,
  View,
  StyleSheet,
  Pressable,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import Svg, { Circle } from 'react-native-svg';

import { useSOS } from './SOSProvider';
import { SOS_STATE } from './emergencyService';

const HOLD_DURATION_MS = 800;
const BUTTON_SIZE      = 160;
const RING_RADIUS      = 72;
const RING_STROKE      = 6;
const CIRCUMFERENCE    = 2 * Math.PI * RING_RADIUS;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export default function PanicButton({ onBeforeSOSTrigger }) {
  const { triggerSOS, sosState, confirmSafe, countdown } = useSOS();
  const progress = useRef(new Animated.Value(0)).current;
  const holdTimer = useRef(null);
  const [holding, setHolding] = useState(false);
  const [fired, setFired] = useState(false);

  useEffect(() => {
    if (sosState === SOS_STATE.IDLE) {
      setFired(false);
      progress.setValue(0);
    }
  }, [sosState]);

  const onPressIn = useCallback(() => {
    if (fired || sosState !== SOS_STATE.IDLE) return;
    setHolding(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    Animated.timing(progress, {
      toValue: 1,
      duration: HOLD_DURATION_MS,
      useNativeDriver: false,
    }).start();

    holdTimer.current = setTimeout(async () => {
      if (!fired) {
        setFired(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        onBeforeSOSTrigger?.();
        await triggerSOS();
      }
    }, HOLD_DURATION_MS);
  }, [fired, sosState, triggerSOS, onBeforeSOSTrigger]);

  const onPressOut = useCallback(() => {
    if (!holding) return;
    setHolding(false);
    clearTimeout(holdTimer.current);
    if (!fired) {
      Animated.timing(progress, { toValue: 0, duration: 200, useNativeDriver: false }).start();
    }
  }, [holding, fired]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: onPressIn,
      onPanResponderRelease: onPressOut,
      onPanResponderTerminate: onPressOut,
    })
  ).current;

  const strokeDashoffset = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [CIRCUMFERENCE, 0],
  });

  // ── Switch between Different Emergency States ──
  if (sosState === SOS_STATE.AWAITING_CHECK) {
    return <VerificationOverlay countdown={countdown} onSafe={confirmSafe} />;
  }

  if (sosState === SOS_STATE.ESCALATED) {
    return <EscalatedBanner />;
  }

  return (
    <View style={styles.centerContainer}>
      <Text style={styles.instructionText}>
        {sosState === SOS_STATE.IDLE ? 'HOLD TO ACTIVATE SOS' : 'SOS ACTIVE...'}
      </Text>

      <View style={{ width: BUTTON_SIZE, height: BUTTON_SIZE, alignItems: 'center', justifyContent: 'center' }}>
        <Svg width={BUTTON_SIZE} height={BUTTON_SIZE} style={StyleSheet.absoluteFill}>
          <Circle cx={BUTTON_SIZE / 2} cy={BUTTON_SIZE / 2} r={RING_RADIUS} stroke="#3d0a0a" strokeWidth={RING_STROKE} fill="none" />
          <AnimatedCircle
            cx={BUTTON_SIZE / 2} cy={BUTTON_SIZE / 2} r={RING_RADIUS}
            stroke={holding ? '#ff2020' : '#ff4444'}
            strokeWidth={RING_STROKE}
            strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="none"
            rotation="-90"
            origin={`${BUTTON_SIZE / 2}, ${BUTTON_SIZE / 2}`}
          />
        </Svg>

        <Animated.View
          {...panResponder.panHandlers}
          style={[styles.innerButton, holding && { transform: [{ scale: 0.95 }] }]}
        >
          <Text style={{ fontSize: 36 }}>🛡️</Text>
          <Text style={styles.buttonLabel}>SOS</Text>
        </Animated.View>
      </View>
      {holding && !fired && <Text style={styles.pulseText}>KEEP HOLDING...</Text>}
    </View>
  );
}

// ── Verification Screen (3-Minute Window) ──
function VerificationOverlay({ countdown, onSafe }) {
  const minutes = Math.floor(countdown / 60).toString().padStart(2, '0');
  const seconds = (countdown % 60).toString().padStart(2, '0');
  const dashOffset = CIRCUMFERENCE * (countdown / 180);

  return (
    <View style={styles.centerContainer}>
      <Text style={styles.overlayTitle}>
        Your contacts have been alerted.{"\n"}Escalating in...
      </Text>

      <View style={styles.ringWrapper}>
        <Svg width={BUTTON_SIZE} height={BUTTON_SIZE} style={StyleSheet.absoluteFill}>
          <Circle cx={BUTTON_SIZE / 2} cy={BUTTON_SIZE / 2} r={RING_RADIUS} stroke="#3d0a0a" strokeWidth={RING_STROKE} fill="none" />
          <Circle
            cx={BUTTON_SIZE / 2} cy={BUTTON_SIZE / 2} r={RING_RADIUS}
            stroke="#ff4444" strokeWidth={RING_STROKE}
            strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
            strokeDashoffset={dashOffset}
            strokeLinecap="round" fill="none" rotation="-90"
            origin={`${BUTTON_SIZE / 2}, ${BUTTON_SIZE / 2}`}
          />
        </Svg>
        <View style={styles.countdownInner}>
          <Text style={styles.countdownText}>{minutes}:{seconds}</Text>
        </View>
      </View>

      <Pressable style={styles.safeButton} onPress={onSafe}>
        <Text style={styles.safeButtonText}>✅ I'M SAFE</Text>
      </Pressable>

      <Text style={styles.disclaimerText}>
        If you do not confirm, emergency services will be alerted automatically.
      </Text>
    </View>
  );
}

// ── Final Escalation Screen (Police Notified) ──
function EscalatedBanner() {
  return (
    <View style={styles.centerContainer}>
      <Text style={styles.emergencyIcon}>🚨</Text>
      <Text style={styles.escalatedTitle}>EMERGENCY SERVICES{"\n"}ALERTED</Text>
      <View style={styles.divider} />
      <Text style={styles.disclaimerTextBright}>
        Your live location and last-known coordinates have been transmitted to local authorities. 
        {"\n\n"}
        Stay calm. Help is on the way.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  centerContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  instructionText: { color: '#666', fontSize: 12, marginBottom: 20, letterSpacing: 2 },
  innerButton: {
    width: BUTTON_SIZE - 24,
    height: BUTTON_SIZE - 24,
    borderRadius: (BUTTON_SIZE - 24) / 2,
    backgroundColor: '#1a0000',
    borderWidth: 2,
    borderColor: '#ff2222',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonLabel: { color: '#ff4444', fontWeight: 'bold', letterSpacing: 4, fontSize: 13, marginTop: 4 },
  pulseText: { color: '#ff6666', fontSize: 12, marginTop: 20 },
  overlayTitle: { color: 'white', fontSize: 18, fontWeight: 'bold', textAlign: 'center', lineHeight: 28 },
  ringWrapper: { width: BUTTON_SIZE, height: BUTTON_SIZE, marginVertical: 40, alignItems: 'center', justifyContent: 'center' },
  countdownInner: { width: BUTTON_SIZE - 20, height: BUTTON_SIZE - 20, borderRadius: 100, backgroundColor: '#1a0000', alignItems: 'center', justifyContent: 'center' },
  countdownText: { color: 'white', fontSize: 32, fontWeight: 'bold', fontFamily: 'monospace' },
  safeButton: { backgroundColor: '#059669', paddingVertical: 18, paddingHorizontal: 50, borderRadius: 100, elevation: 5, marginTop: 10 },
  safeButtonText: { color: 'white', fontWeight: 'bold', fontSize: 18, letterSpacing: 1 },
  disclaimerText: { color: '#666', fontSize: 13, textAlign: 'center', marginTop: 25, paddingHorizontal: 30, lineHeight: 20 },
  
  // Escalated Screen Styles
  emergencyIcon: { fontSize: 64, marginBottom: 20 },
  escalatedTitle: { color: '#ff4444', fontSize: 24, fontWeight: '900', letterSpacing: 2, textAlign: 'center', marginBottom: 10 },
  divider: { width: 40, height: 4, backgroundColor: '#ff4444', borderRadius: 2, marginVertical: 15 },
  disclaimerTextBright: { color: '#bbb', fontSize: 15, textAlign: 'center', paddingHorizontal: 30, lineHeight: 24 },
});