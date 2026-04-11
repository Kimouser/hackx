/**
 * PanicButton.jsx
 * Project Guardian – Emergency Module
 *
 * Long-press SOS trigger:
 *   • 800ms hold required (prevents accidental fires)
 *   • Animated radial sweep progress ring
 *   • Haptic burst on successful trigger
 *   • NativeWind (Tailwind) + Animated API
 *
 * Drop into: src/modules/emergency/PanicButton.jsx
 *
 * Peer deps: expo-haptics, react-native-svg, nativewind
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  PanResponder,
  Text,
  View,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import Svg, { Circle } from 'react-native-svg';

import { useSOS } from './SOSProvider';
import { SOS_STATE } from './emergencyService';

// ─── Config ────────────────────────────────────────────────────────────────────

const HOLD_DURATION_MS = 800;
const BUTTON_SIZE      = 160;   // outer diameter
const RING_RADIUS      = 72;
const RING_STROKE      = 6;
const CIRCUMFERENCE    = 2 * Math.PI * RING_RADIUS;

// Animated circle wrapper (react-native-svg doesn't accept Animated values natively)
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// ─── Component ─────────────────────────────────────────────────────────────────

/**
 * PanicButton
 *
 * @param {{ onBeforeSOSTrigger?: () => void }} props
 */
export default function PanicButton({ onBeforeSOSTrigger }) {
  const { triggerSOS, sosState, confirmSafe, countdown, SOS_STATE } = useSOS();

  // Progress ring: 0 → 1 over HOLD_DURATION_MS
  const progress     = useRef(new Animated.Value(0)).current;
  const holdTimer    = useRef(null);
  const [holding, setHolding]   = useState(false);
  const [fired, setFired]       = useState(false);  // prevent double-fire in same hold

  // Reset progress & fired state when SOS returns to IDLE
  useEffect(() => {
    if (sosState === SOS_STATE.IDLE) {
      setFired(false);
      progress.setValue(0);
    }
  }, [sosState]);

  // ── Hold handlers ───────────────────────────────────────────────────────────

  const onPressIn = useCallback(() => {
    if (fired || sosState !== SOS_STATE.IDLE) return;

    setHolding(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Animate ring fill over HOLD_DURATION_MS
    Animated.timing(progress, {
      toValue: 1,
      duration: HOLD_DURATION_MS,
      useNativeDriver: false, // strokeDashoffset is not supported by native driver
    }).start();

    // Fire after hold duration
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
      // User released early – reset ring
      Animated.timing(progress, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }
  }, [holding, fired]);

  // PanResponder avoids the "release outside" gap that TouchableOpacity misses
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant:  () => onPressIn(),
      onPanResponderRelease: () => onPressOut(),
      onPanResponderTerminate: () => onPressOut(),
    })
  ).current;

  // ── Derived ring animation ──────────────────────────────────────────────────

  const strokeDashoffset = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [CIRCUMFERENCE, 0],
  });

  // ── State-aware rendering ───────────────────────────────────────────────────

  if (sosState === SOS_STATE.AWAITING_CHECK) {
    return <VerificationOverlay countdown={countdown} onSafe={confirmSafe} />;
  }

  if (sosState === SOS_STATE.ESCALATED) {
    return <EscalatedBanner />;
  }

  // ── Main Panic Button ───────────────────────────────────────────────────────

  const isArmed = sosState === SOS_STATE.IDLE;

  return (
    <View className="items-center justify-center">
      {/* Instructional label */}
      <Text className="text-neutral-400 text-sm mb-4 tracking-widest uppercase">
        {isArmed ? 'Hold to activate SOS' : 'SOS Active…'}
      </Text>

      {/* Outer glow ring + button */}
      <View
        style={{ width: BUTTON_SIZE, height: BUTTON_SIZE }}
        className="items-center justify-center"
      >
        {/* Progress ring SVG – sits behind everything */}
        <Svg
          width={BUTTON_SIZE}
          height={BUTTON_SIZE}
          style={{ position: 'absolute' }}
        >
          {/* Track ring */}
          <Circle
            cx={BUTTON_SIZE / 2}
            cy={BUTTON_SIZE / 2}
            r={RING_RADIUS}
            stroke="#3d0a0a"
            strokeWidth={RING_STROKE}
            fill="none"
          />
          {/* Progress ring */}
          <AnimatedCircle
            cx={BUTTON_SIZE / 2}
            cy={BUTTON_SIZE / 2}
            r={RING_RADIUS}
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

        {/* Touchable inner button */}
        <Animated.View
          {...panResponder.panHandlers}
          style={[
            {
              width: BUTTON_SIZE - RING_STROKE * 4,
              height: BUTTON_SIZE - RING_STROKE * 4,
              borderRadius: (BUTTON_SIZE - RING_STROKE * 4) / 2,
            },
            holding && { transform: [{ scale: 0.95 }] },
          ]}
          className="items-center justify-center bg-[#1a0000] border-2 border-[#ff2222]"
        >
          {/* Shield icon (Unicode fallback – swap with lucide/react-native-vector-icons) */}
          <Text style={{ fontSize: 36 }}>🛡️</Text>
          <Text
            className="text-[#ff4444] font-bold tracking-[4px] mt-1"
            style={{ fontSize: 13 }}
          >
            SOS
          </Text>
        </Animated.View>
      </View>

      {holding && !fired && (
        <Text className="text-[#ff6666] text-xs mt-4 animate-pulse">
          Keep holding…
        </Text>
      )}
    </View>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

/**
 * VerificationOverlay – shown during the 3-minute check window.
 * Renders a countdown ring + "I'm Safe" button.
 */
function VerificationOverlay({ countdown, onSafe }) {
  const minutes = Math.floor(countdown / 60).toString().padStart(2, '0');
  const seconds = (countdown % 60).toString().padStart(2, '0');

  const fraction = countdown / 180; // 0→1 as time runs out
  const dashOffset = CIRCUMFERENCE * fraction;

  return (
    <View className="items-center justify-center gap-6">
      <Text className="text-white text-base font-semibold tracking-wide text-center px-4">
        Your contacts have been alerted.{'\n'}Escalating in…
      </Text>

      {/* Countdown ring */}
      <View
        style={{ width: BUTTON_SIZE, height: BUTTON_SIZE }}
        className="items-center justify-center"
      >
        <Svg width={BUTTON_SIZE} height={BUTTON_SIZE} style={{ position: 'absolute' }}>
          <Circle
            cx={BUTTON_SIZE / 2}
            cy={BUTTON_SIZE / 2}
            r={RING_RADIUS}
            stroke="#3d0a0a"
            strokeWidth={RING_STROKE}
            fill="none"
          />
          <Circle
            cx={BUTTON_SIZE / 2}
            cy={BUTTON_SIZE / 2}
            r={RING_RADIUS}
            stroke="#ff4444"
            strokeWidth={RING_STROKE}
            strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            fill="none"
            rotation="-90"
            origin={`${BUTTON_SIZE / 2}, ${BUTTON_SIZE / 2}`}
          />
        </Svg>

        <View className="items-center justify-center bg-[#1a0000] rounded-full"
              style={{ width: BUTTON_SIZE - 20, height: BUTTON_SIZE - 20 }}>
          <Text className="text-white text-3xl font-bold font-mono">
            {minutes}:{seconds}
          </Text>
        </View>
      </View>

      {/* Safe confirmation */}
      <Animated.View
        className="bg-emerald-700 active:bg-emerald-600 px-10 py-4 rounded-full"
        style={{ elevation: 4 }}
      >
        <Text
          className="text-white font-bold text-base tracking-wider"
          onPress={onSafe}
        >
          ✅  I'M SAFE
        </Text>
      </Animated.View>

      <Text className="text-neutral-500 text-xs text-center px-6">
        If you do not confirm, emergency services will be alerted automatically.
      </Text>
    </View>
  );
}

/** EscalatedBanner – shown when emergency services have been notified. */
function EscalatedBanner() {
  return (
    <View className="items-center justify-center gap-4 px-6">
      <Text style={{ fontSize: 48 }}>🚨</Text>
      <Text className="text-[#ff4444] text-xl font-bold tracking-widest text-center">
        EMERGENCY SERVICES{'\n'}ALERTED
      </Text>
      <Text className="text-neutral-300 text-sm text-center leading-6">
        Your live location and last-known coordinates have been transmitted.
        Stay as calm as possible. Help is on the way.
      </Text>
    </View>
  );
}
