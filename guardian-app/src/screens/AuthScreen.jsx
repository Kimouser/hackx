import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Alert,
} from 'react-native';
import colors from '../theme/colors';
import { createUser, loginUser } from '../db/database';

const AuthScreen = ({ navigation }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState('user'); // 'user' or 'volunteer'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [aadhar, setAadhar] = useState('');
  const [area, setArea] = useState('');

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

        {/* Role Selection */}
        <View style={styles.roleContainer}>
          <TouchableOpacity
            style={[styles.roleBtn, role === 'user' && styles.selectedRole]}
            onPress={() => setRole('user')}
          >
            <Text style={[styles.roleText, role === 'user' && styles.selectedRoleText]}>Login as User</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.roleBtn, role === 'volunteer' && styles.selectedRole]}
            onPress={() => setRole('volunteer')}
          >
            <Text style={[styles.roleText, role === 'volunteer' && styles.selectedRoleText]}>Login as Volunteer Bodyguard</Text>
          </TouchableOpacity>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Full Name"
            placeholderTextColor={colors.textMuted}
            value={name}
            onChangeText={setName}
          />
          {!isLogin && role === 'volunteer' && (
            <TextInput
              style={styles.input}
              placeholder="Aadhar Card Number"
              placeholderTextColor={colors.textMuted}
              value={aadhar}
              onChangeText={setAadhar}
              keyboardType="numeric"
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
          {!isLogin && role === 'volunteer' && (
            <TextInput
              style={styles.input}
              placeholder="Area of Residence"
              placeholderTextColor={colors.textMuted}
              value={area}
              onChangeText={setArea}
            />
          )}
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={colors.textMuted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity style={styles.btn} onPress={handleSubmit}>
            <Text style={styles.btnText}>{isLogin ? 'Login' : 'Sign Up'}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
            <Text style={styles.toggle}>
              {isLogin ? "Don't have an account? Sign Up" : 'Already have an account? Login'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.skipBtn} onPress={() => navigation.replace('Main')}>
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
  roleContainer: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  roleBtn: {
    flex: 1, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', backgroundColor: colors.surface,
  },
  selectedRole: { borderColor: colors.safe, backgroundColor: colors.accentDim },
  roleText: { color: colors.textSecondary, fontSize: 14 },
  selectedRoleText: { color: colors.safe, fontWeight: '600' },
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
