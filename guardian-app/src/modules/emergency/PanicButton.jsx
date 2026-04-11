/**
 * PanicButton.jsx
 * Project Guardian – Emergency Module
 *
 * Colour scheme updated to purple/violet to match the app theme.
 * Ring, glow, label and verification overlay all use #7c4dff / #a07dff.
 *
 * Drop into: src/modules/emergency/PanicButton.jsx
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
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

const T = {
  ring:        '#7c4dff',
  ringActive:  '#a07dff',
  ringTrack:   '#1e1535',
  btnBg:       '#0d0a1a',
  btnBorder:   '#7c4dff',
  labelColor:  '#a07dff',
  pulseColor:  '#c4b0ff',
  safeBtn:     '#059669',
  escalated:   '#7c4dff',
};

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export default function PanicButton({ onBeforeSOSTrigger }) {
  const { triggerSOS, sosState, confirmSafe, countdown } = useSOS();

  const progress  = useRef(new Animated.Value(0)).current;
  const holdTimer = useRef(null);
  const [holding, setHolding] = useState(false);
  const [fired,   setFired]   = useState(false);

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
    Animated.timing(progress, { toValue: 1, duration: HOLD_DURATION_MS, useNativeDriver: false }).start();
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
      onPanResponderGrant:     onPressIn,
      onPanResponderRelease:   onPressOut,
      onPanResponderTerminate: onPressOut,
    })
  ).current;

  const strokeDashoffset = progress.interpolate({
    inputRange: [0, 1], outputRange: [CIRCUMFERENCE, 0],
  });

  if (sosState === SOS_STATE.AWAITING_CHECK) return <VerificationOverlay countdown={countdown} onSafe={confirmSafe} />;
  if (sosState === SOS_STATE.ESCALATED)      return <EscalatedBanner />;

  return (
    <View style={styles.center}>
      
      <View style={{ width: BUTTON_SIZE, height: BUTTON_SIZE, alignItems: 'center', justifyContent: 'center' }}>
        <Svg width={BUTTON_SIZE} height={BUTTON_SIZE} style={StyleSheet.absoluteFill}>
          <Circle cx={BUTTON_SIZE/2} cy={BUTTON_SIZE/2} r={RING_RADIUS} stroke={T.ringTrack} strokeWidth={RING_STROKE} fill="none"/>
          <AnimatedCircle
            cx={BUTTON_SIZE/2} cy={BUTTON_SIZE/2} r={RING_RADIUS}
            stroke={holding ? T.ringActive : T.ring}
            strokeWidth={RING_STROKE}
            strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round" fill="none"
            rotation="-90" origin={`${BUTTON_SIZE/2}, ${BUTTON_SIZE/2}`}
          />
        </Svg>
        <Animated.View {...panResponder.panHandlers} style={[styles.innerButton, holding && { transform: [{ scale: 0.95 }] }]}>
          <Text style={styles.shieldIcon}>🛡️</Text>
          <Text style={styles.buttonLabel}>SOS</Text>
        </Animated.View>
      </View>
      {holding && !fired && <Text style={styles.pulseText}>KEEP HOLDING…</Text>}
    </View>
  );
}

function VerificationOverlay({ countdown, onSafe }) {
  const minutes    = Math.floor(countdown / 60).toString().padStart(2, '0');
  const seconds    = (countdown % 60).toString().padStart(2, '0');
  const dashOffset = CIRCUMFERENCE * (countdown / 180);

  return (
    <View style={styles.center}>
      <Text style={styles.overlayTitle}>Your contacts have been alerted.{'\n'}Escalating in…</Text>
      <View style={styles.ringWrapper}>
        <Svg width={BUTTON_SIZE} height={BUTTON_SIZE} style={StyleSheet.absoluteFill}>
          <Circle cx={BUTTON_SIZE/2} cy={BUTTON_SIZE/2} r={RING_RADIUS} stroke={T.ringTrack} strokeWidth={RING_STROKE} fill="none"/>
          <Circle
            cx={BUTTON_SIZE/2} cy={BUTTON_SIZE/2} r={RING_RADIUS}
            stroke={T.ring} strokeWidth={RING_STROKE}
            strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
            strokeDashoffset={dashOffset}
            strokeLinecap="round" fill="none"
            rotation="-90" origin={`${BUTTON_SIZE/2}, ${BUTTON_SIZE/2}`}
          />
        </Svg>
        <View style={styles.countdownInner}>
          <Text style={styles.countdownText}>{minutes}:{seconds}</Text>
        </View>
      </View>
      <Pressable style={styles.safeButton} onPress={onSafe}>
        <Text style={styles.safeButtonText}>✅  I'M SAFE</Text>
      </Pressable>
      <Text style={styles.disclaimer}>
        If you do not confirm, emergency services will be alerted automatically.
      </Text>
    </View>
  );
}

function EscalatedBanner() {
  return (
    <View style={styles.center}>
      <Text style={styles.escalatedIcon}>🛡️</Text>
      <Text style={styles.escalatedTitle}>EMERGENCY SERVICES{'\n'}ALERTED</Text>
      <View style={styles.escalatedDivider} />
      <Text style={styles.escalatedBody}>
        Your live location and last-known coordinates have been transmitted to local authorities.{'\n\n'}Stay calm. Help is on the way.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  instruction: { color: '#504d6a', fontSize: 10, letterSpacing: 3, marginBottom: 20 },
  innerButton: {
    width: BUTTON_SIZE - 24, height: BUTTON_SIZE - 24,
    borderRadius: (BUTTON_SIZE - 24) / 2,
    backgroundColor: T.btnBg, borderWidth: 2, borderColor: T.btnBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  shieldIcon:  { fontSize: 36 },
  buttonLabel: { color: T.labelColor, fontWeight: '800', letterSpacing: 4, fontSize: 12, marginTop: 4 },
  pulseText:   { color: T.pulseColor, fontSize: 11, marginTop: 20, letterSpacing: 2 },
  overlayTitle: { color: '#e8e6f0', fontSize: 17, fontWeight: '600', textAlign: 'center', lineHeight: 26, marginBottom: 4 },
  ringWrapper:  { width: BUTTON_SIZE, height: BUTTON_SIZE, marginVertical: 36, alignItems: 'center', justifyContent: 'center' },
  countdownInner: { width: BUTTON_SIZE - 20, height: BUTTON_SIZE - 20, borderRadius: 100, backgroundColor: T.btnBg, alignItems: 'center', justifyContent: 'center' },
  countdownText: { color: '#e8e6f0', fontSize: 32, fontWeight: '800', fontFamily: 'monospace' },
  safeButton: { backgroundColor: T.safeBtn, paddingVertical: 16, paddingHorizontal: 48, borderRadius: 100, marginTop: 8 },
  safeButtonText: { color: '#fff', fontWeight: '800', fontSize: 17, letterSpacing: 1 },
  disclaimer: { color: '#504d6a', fontSize: 12, textAlign: 'center', marginTop: 22, paddingHorizontal: 28, lineHeight: 20 },
  escalatedIcon: { fontSize: 56, marginBottom: 18 },
  escalatedTitle: { color: T.escalated, fontSize: 22, fontWeight: '900', letterSpacing: 2, textAlign: 'center' },
  escalatedDivider: { width: 40, height: 3, backgroundColor: T.escalated, borderRadius: 2, marginVertical: 16 },
  escalatedBody: { color: '#9895b0', fontSize: 14, textAlign: 'center', paddingHorizontal: 28, lineHeight: 24 },
});
