import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Alert,
  Animated, Dimensions,
} from 'react-native';
import { createUser, loginUser } from '../db/database';

const { width } = Dimensions.get('window');

// ── Themes ────────────────────────────────────────────────────────────────────

const userTheme = {
  bg:              '#0a0f0a',
  surface:         '#111811',
  surfaceAlt:      '#0d140d',
  border:          '#1e3a1e',
  borderActive:    '#00e676',
  accent:          '#00e676',
  accentDim:       '#00e67614',
  accentGlow:      '#00e67633',
  textPrimary:     '#e8f5e8',
  textSecondary:   '#6aab6a',
  textMuted:       '#3d6b3d',
  btnText:         '#0a0f0a',
  shield:          '🛡️',
  taglineIcon:     '🗺️',
  dividerColor:    '#00e676',
  inputShadow:     'transparent',
  particleColor:   '#00e676',
};

const volunteerTheme = {
  bg:              '#fdf9f0',
  surface:         '#fffdf7',
  surfaceAlt:      '#fef9ec',
  border:          '#e8d9b0',
  borderActive:    '#c9972a',
  accent:          '#c9972a',
  accentDim:       '#c9972a18',
  accentGlow:      '#f0c040aa',
  textPrimary:     '#2d2010',
  textSecondary:   '#7a5c1e',
  textMuted:       '#b89a50',
  btnText:         '#fff8e8',
  shield:          '👼',
  taglineIcon:     '✨',
  dividerColor:    '#c9972a',
  inputShadow:     '#f0c04020',
  particleColor:   '#f0c040',
};

// ── Particle component (floating orbs) ────────────────────────────────────────

const FloatingOrb = ({ style, color }) => {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 3000 + Math.random() * 2000, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 3000 + Math.random() * 2000, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [0, -18] });
  const opacity    = anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.15, 0.55, 0.15] });
  return (
    <Animated.View style={[style, { transform: [{ translateY }], opacity, backgroundColor: color, borderRadius: 100 }]} />
  );
};

// ── Main Component ─────────────────────────────────────────────────────────────

const AuthScreen = ({ navigation }) => {
  const [isLogin, setIsLogin]     = useState(true);
  const [role, setRole]           = useState('user');
  const [name, setName]           = useState('');
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [aadhar, setAadhar]       = useState('');
  const [area, setArea]           = useState('');

  const themeAnim = useRef(new Animated.Value(0)).current;
  const isVolunteer = role === 'volunteer';
  const T = isVolunteer ? volunteerTheme : userTheme;

  useEffect(() => {
    Animated.timing(themeAnim, {
      toValue: isVolunteer ? 1 : 0,
      duration: 600,
      useNativeDriver: false,
    }).start();
  }, [isVolunteer]);

  // Interpolated animated colors
  const animBg      = themeAnim.interpolate({ inputRange: [0, 1], outputRange: [userTheme.bg, volunteerTheme.bg] });
  const animAccent  = themeAnim.interpolate({ inputRange: [0, 1], outputRange: [userTheme.accent, volunteerTheme.accent] });
  const animTitle   = themeAnim.interpolate({ inputRange: [0, 1], outputRange: [userTheme.accent, volunteerTheme.accent] });

  const handleSubmit = async () => {
    try {
      if (isLogin) {
        await loginUser({ name, email, password, role });
      } else {
        await createUser({ name, email, password, role, aadhar, area });
      }
      navigation.replace('Main');
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const s = makeStyles(T);

  return (
    <Animated.View style={[s.root, { backgroundColor: animBg }]}>
      {/* Ambient orbs — angelic mode only */}
      {isVolunteer && (
        <>
          <FloatingOrb color={volunteerTheme.particleColor} style={{ position:'absolute', top:60,  left:30,  width:80,  height:80 }} />
          <FloatingOrb color={volunteerTheme.particleColor} style={{ position:'absolute', top:120, right:20, width:50,  height:50 }} />
          <FloatingOrb color='#fff0c0'                       style={{ position:'absolute', top:200, left:width*0.4, width:36, height:36 }} />
          <FloatingOrb color={volunteerTheme.particleColor} style={{ position:'absolute', top:300, right:60, width:24, height:24 }} />
        </>
      )}

      {/* Dark-mode radial glow */}
      {!isVolunteer && (
        <View style={s.bgGlow} pointerEvents="none" />
      )}

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

          {/* ── Logo area ── */}
          <View style={s.logoArea}>
            {isVolunteer ? (
              <View style={s.haloRing}>
                <Text style={s.shieldEmoji}>👼</Text>
              </View>
            ) : (
              <Text style={s.shieldEmoji}>🛡️</Text>
            )}

            <Animated.Text style={[s.title, { color: animTitle }]}>
              Project Guardian
            </Animated.Text>

            <Text style={s.tagline}>
              {isVolunteer ? '✨ Volunteer Bodyguard Portal ✨' : 'AI-Powered Safe-Passage'}
            </Text>

            <View style={s.divider} />

            <Text style={s.subtitle}>
              {isVolunteer
                ? 'Protect. Serve. Shine.'
                : 'Navigate Safe. Stay Protected.'}
            </Text>
          </View>

          {/* ── Role toggle ── */}
          <View style={s.roleContainer}>
            <TouchableOpacity
              style={[s.roleBtn, role === 'user' && s.selectedRole]}
              onPress={() => setRole('user')}
              activeOpacity={0.8}
            >
              <Text style={[s.roleText, role === 'user' && s.selectedRoleText]}>
                👤  User
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.roleBtn, role === 'volunteer' && s.selectedRole]}
              onPress={() => setRole('volunteer')}
              activeOpacity={0.8}
            >
              <Text style={[s.roleText, role === 'volunteer' && s.selectedRoleText]}>
                👼  Volunteer
              </Text>
            </TouchableOpacity>
          </View>

          {/* ── Form ── */}
          <View style={s.form}>
            <TextInput
              style={s.input}
              placeholder="Full Name"
              placeholderTextColor={T.textMuted}
              value={name}
              onChangeText={setName}
            />

            {!isLogin && role === 'volunteer' && (
              <TextInput
                style={s.input}
                placeholder="Aadhar Card Number"
                placeholderTextColor={T.textMuted}
                value={aadhar}
                onChangeText={setAadhar}
                keyboardType="numeric"
              />
            )}

            <TextInput
              style={s.input}
              placeholder="Email"
              placeholderTextColor={T.textMuted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            {!isLogin && role === 'volunteer' && (
              <TextInput
                style={s.input}
                placeholder="Area of Residence"
                placeholderTextColor={T.textMuted}
                value={area}
                onChangeText={setArea}
              />
            )}

            <TextInput
              style={s.input}
              placeholder="Password"
              placeholderTextColor={T.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            <TouchableOpacity style={s.btn} onPress={handleSubmit} activeOpacity={0.85}>
              {isVolunteer && <Text style={s.btnGlow}>✦</Text>}
              <Text style={s.btnText}>{isLogin ? 'Login' : 'Sign Up'}</Text>
              {isVolunteer && <Text style={s.btnGlow}>✦</Text>}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setIsLogin(!isLogin)} activeOpacity={0.7}>
              <Text style={s.toggle}>
                {isLogin ? "Don't have an account? Sign Up" : 'Already have an account? Login'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={s.skipBtn} onPress={() => navigation.replace('Main')} activeOpacity={0.6}>
              <Text style={s.skipText}>Skip for Demo →</Text>
            </TouchableOpacity>
          </View>

          {/* ── Features ── */}
          <View style={s.features}>
            {(isVolunteer
              ? [
                  ['🕊️', 'Volunteer Dispatch Network'],
                  ['🛡️', 'Escort & Guardianship Tasks'],
                  ['📍', 'Live Location Sharing'],
                  ['⭐', 'Trust Score & Reputation'],
                ]
              : [
                  ['🗺️', 'Safety-First Navigation'],
                  ['📢', 'Community Threat Reporting'],
                  ['📧', 'Automated Municipal Alerts'],
                  ['🆘', 'Guardian Bracelet SOS'],
                ]
            ).map(([icon, label]) => (
              <View key={label} style={s.featureRow}>
                <Text style={s.featureIcon}>{icon}</Text>
                <Text style={s.featureText}>{label}</Text>
              </View>
            ))}
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </Animated.View>
  );
};

// ── Dynamic styles factory ─────────────────────────────────────────────────────

const makeStyles = (T) => StyleSheet.create({
  root:        { flex: 1 },
  scroll:      { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 40 },

  bgGlow: {
    position: 'absolute', top: -100, left: width / 2 - 180,
    width: 360, height: 360,
    borderRadius: 180,
    backgroundColor: '#00e67608',
  },

  // Logo
  logoArea:    { alignItems: 'center', marginBottom: 32 },
  haloRing: {
    width: 104, height: 104, borderRadius: 52,
    borderWidth: 2, borderColor: '#f0c040',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#f0c040', shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9, shadowRadius: 20, elevation: 12,
    backgroundColor: '#fffbe8',
    marginBottom: 4,
  },
  shieldEmoji: { fontSize: 72, marginBottom: 10 },
  title: {
    fontSize: 30, fontWeight: '800',
    letterSpacing: 0.4, marginBottom: 4,
  },
  tagline:     { fontSize: 13, color: T.textSecondary, marginTop: 2, letterSpacing: 0.2 },
  divider: {
    width: 36, height: 2, backgroundColor: T.dividerColor,
    marginVertical: 12, borderRadius: 1,
  },
  subtitle:    { fontSize: 12, color: T.textMuted, fontStyle: 'italic' },

  // Role toggle
  roleContainer: {
    flexDirection: 'row', gap: 10, marginBottom: 22,
    backgroundColor: T.surfaceAlt,
    borderRadius: 12, padding: 4,
    borderWidth: 1, borderColor: T.border,
  },
  roleBtn: {
    flex: 1, paddingVertical: 11, paddingHorizontal: 6,
    borderRadius: 9, alignItems: 'center',
  },
  selectedRole: {
    backgroundColor: T.accentDim,
    borderWidth: 1, borderColor: T.borderActive,
    shadowColor: T.accentGlow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1, shadowRadius: 8, elevation: 4,
  },
  roleText:         { color: T.textMuted, fontSize: 13, fontWeight: '500' },
  selectedRoleText: { color: T.accent, fontWeight: '700' },

  // Form
  form:  { gap: 12 },
  input: {
    backgroundColor: T.surface,
    borderWidth: 1, borderColor: T.border,
    borderRadius: 12, padding: 15,
    color: T.textPrimary, fontSize: 15,
    shadowColor: T.inputShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1, shadowRadius: 6, elevation: 2,
  },
  btn: {
    backgroundColor: T.accent,
    borderRadius: 12, padding: 16,
    alignItems: 'center', marginTop: 8,
    flexDirection: 'row', justifyContent: 'center', gap: 8,
    shadowColor: T.accentGlow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.8, shadowRadius: 12, elevation: 8,
  },
  btnText:  { color: T.btnText, fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },
  btnGlow:  { color: T.btnText, fontSize: 14, opacity: 0.7 },
  toggle:   { color: T.textSecondary, textAlign: 'center', marginTop: 12, fontSize: 13 },
  skipBtn:  { marginTop: 14, alignItems: 'center' },
  skipText: { color: T.textMuted, fontSize: 13 },

  // Features
  features: {
    marginTop: 32, paddingTop: 20,
    borderTopWidth: 1, borderTopColor: T.border,
    gap: 10,
  },
  featureRow:  { flexDirection: 'row', alignItems: 'center', gap: 12 },
  featureIcon: { fontSize: 17, width: 26, textAlign: 'center' },
  featureText: { color: T.textSecondary, fontSize: 13, flex: 1 },
});

export default AuthScreen;
