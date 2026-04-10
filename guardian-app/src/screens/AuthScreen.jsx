import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import colors from '../theme/colors';

const AuthScreen = ({ navigation }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = () => {
    // For hackathon demo — skip real auth, go straight to app
    navigation.replace('Main');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Logo */}
        <View style={styles.logoArea}>
          <Text style={styles.shield}>🛡️</Text>
          <Text style={styles.title}>Project Guardian</Text>
          <Text style={styles.tagline}>AI-Powered Safe-Passage</Text>
          <View style={styles.divider} />
          <Text style={styles.subtitle}>Navigate Safe. Stay Protected.</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {!isLogin && (
            <TextInput
              style={styles.input}
              placeholder="Full Name"
              placeholderTextColor={colors.textMuted}
              value={name}
              onChangeText={setName}
            />
          )}
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={colors.textMuted}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={colors.textMuted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity style={styles.btn} onPress={handleSubmit}>
            <Text style={styles.btnText}>{isLogin ? 'Login' : 'Register'}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
            <Text style={styles.toggle}>
              {isLogin ? "Don't have an account? Register" : 'Already have an account? Login'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.skipBtn} onPress={handleSubmit}>
            <Text style={styles.skipText}>Skip for Demo →</Text>
          </TouchableOpacity>
        </View>

        {/* Features preview */}
        <View style={styles.features}>
          <View style={styles.featureRow}>
            <Text style={styles.featureIcon}>🗺️</Text>
            <Text style={styles.featureText}>Safety-First Navigation</Text>
          </View>
          <View style={styles.featureRow}>
            <Text style={styles.featureIcon}>📢</Text>
            <Text style={styles.featureText}>Community Threat Reporting</Text>
          </View>
          <View style={styles.featureRow}>
            <Text style={styles.featureIcon}>📧</Text>
            <Text style={styles.featureText}>Automated Municipal Alerts</Text>
          </View>
          <View style={styles.featureRow}>
            <Text style={styles.featureIcon}>🆘</Text>
            <Text style={styles.featureText}>Guardian Bracelet SOS</Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  logoArea: { alignItems: 'center', marginBottom: 36 },
  shield: { fontSize: 72, marginBottom: 8 },
  title: { fontSize: 30, fontWeight: '800', color: colors.safe, letterSpacing: 0.5 },
  tagline: { fontSize: 14, color: colors.textSecondary, marginTop: 4 },
  divider: {
    width: 40, height: 2, backgroundColor: colors.safe,
    marginVertical: 12, borderRadius: 1, opacity: 0.5,
  },
  subtitle: { fontSize: 13, color: colors.textMuted, fontStyle: 'italic' },
  form: { gap: 14 },
  input: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: 10, padding: 14, color: colors.textPrimary, fontSize: 16,
  },
  btn: {
    backgroundColor: colors.safe, borderRadius: 10,
    padding: 16, alignItems: 'center', marginTop: 6,
  },
  btnText: { color: colors.bg, fontSize: 16, fontWeight: '700' },
  toggle: { color: colors.textSecondary, textAlign: 'center', marginTop: 10 },
  skipBtn: { marginTop: 14, alignItems: 'center' },
  skipText: { color: colors.textMuted, fontSize: 13 },
  features: {
    marginTop: 36, paddingTop: 20,
    borderTopWidth: 1, borderTopColor: colors.border, gap: 10,
  },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  featureIcon: { fontSize: 18 },
  featureText: { color: colors.textSecondary, fontSize: 13 },
});

export default AuthScreen;
