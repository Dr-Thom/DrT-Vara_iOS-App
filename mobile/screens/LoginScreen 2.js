import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Linking,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';

const friendlyError = (err) => {
  const raw = (err && err.message) ? String(err.message).toLowerCase() : '';
  if (raw.includes('cannot reach') || raw.includes('network') || raw.includes('failed to fetch')) {
    return { title: 'Connection problem', body: 'We can\'t reach the SAMSON server right now. Please check your internet connection and try again.' };
  }
  if (raw.includes('incorrect') || raw.includes('invalid') || raw.includes('credentials') || raw.includes('password') || raw.includes('email')) {
    return { title: 'Wrong email or password', body: 'Double-check your email and password and try again. Tip: tap "Show" to make sure your password is typed correctly.' };
  }
  if (raw.includes('500') || raw.includes('502') || raw.includes('503') || raw.includes('server')) {
    return { title: 'SAMSON is having a hiccup', body: 'Our server is temporarily unavailable. Please wait a minute and try again.' };
  }
  if (raw.includes('429') || raw.includes('too many')) {
    return { title: 'Too many attempts', body: 'You\'ve tried logging in too many times. Please wait 5 minutes before trying again.' };
  }
  return { title: 'Login failed', body: err?.message || 'Something went wrong. Please try again.' };
};

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const passwordRef = useRef(null);

  const handleLogin = async () => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password;
    if (!cleanEmail || !cleanPassword) {
      Alert.alert('Missing info', 'Please enter both email and password.');
      return;
    }
    if (cleanPassword !== cleanPassword.trim()) {
      Alert.alert(
        'Password has spaces',
        'Your password starts or ends with a space (often from autofill). Want to remove the spaces and try again?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Trim & log in', onPress: async () => { setPassword(cleanPassword.trim()); setTimeout(() => doLogin(cleanEmail, cleanPassword.trim()), 50); } },
          { text: 'Keep as-is', onPress: () => doLogin(cleanEmail, cleanPassword) },
        ],
      );
      return;
    }
    doLogin(cleanEmail, cleanPassword);
  };

  const doLogin = async (cleanEmail, cleanPassword) => {
    setLoading(true);
    try {
      await login(cleanEmail, cleanPassword);
    } catch (error) {
      if (__DEV__) console.log('[LoginScreen] login error:', error?.message, error);
      const { title, body } = friendlyError(error);
      Alert.alert(title, body);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    Alert.alert(
      'Reset your password',
      'Password reset is coming soon. For now, email support and we\'ll help you reset within 24 hours.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Email support', onPress: () => Linking.openURL('mailto:varaplatforms@yahoo.com?subject=SAMSON%20Password%20Reset&body=Hi%20Samson%20team%2C%0A%0AI%20need%20to%20reset%20my%20password.%20My%20email%20is%3A%20') },
      ],
    );
  };

  const fillTestAccount = () => { setEmail('admin@vara.com'); setPassword('vara_admin_2026'); };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.logo}>SAMSON</Text>
            <View style={styles.bonusBadge}><Text style={styles.bonusText}>$1 Bonus</Text></View>
          </View>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Log in to continue earning</Text>
          <View style={styles.form}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="your@email.com" placeholderTextColor="#9CA3AF"
              value={email} onChangeText={setEmail}
              autoCapitalize="none" autoCorrect={false} spellCheck={false}
              keyboardType="email-address" autoComplete="email" textContentType="emailAddress"
              returnKeyType="next" onSubmitEditing={() => passwordRef.current?.focus()}
              blurOnSubmit={false} editable={!loading}
              data-testid="login-email-input"
            />
            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordWrapper}>
              <TextInput
                ref={passwordRef}
                style={[styles.input, styles.passwordInput]}
                placeholder="Enter your password" placeholderTextColor="#9CA3AF"
                value={password}
                onChangeText={(t) => { if (__DEV__) console.log('[LoginScreen] password length:', t.length); setPassword(t); }}
                secureTextEntry={!showPassword}
                autoCapitalize="none" autoCorrect={false} spellCheck={false}
                autoComplete="password" textContentType="password" importantForAutofill="yes"
                returnKeyType="go" onSubmitEditing={handleLogin}
                editable={!loading}
                data-testid="login-password-input"
              />
              <TouchableOpacity style={styles.passwordToggle} onPress={() => setShowPassword((v) => !v)} accessibilityLabel={showPassword ? 'Hide password' : 'Show password'} data-testid="password-toggle-btn">
                <Text style={styles.passwordToggleText}>{showPassword ? 'Hide' : 'Show'}</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={handleForgotPassword} disabled={loading} style={styles.forgotPwdContainer} data-testid="forgot-password-btn">
              <Text style={styles.forgotPwdText}>Forgot password?</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleLogin} disabled={loading} data-testid="login-submit-btn">
              {loading ? (
                <View style={styles.buttonLoadingRow}>
                  <ActivityIndicator color="#fff" size="small" />
                  <Text style={[styles.buttonText, { marginLeft: 8 }]}>Logging in…</Text>
                </View>
              ) : <Text style={styles.buttonText}>Log In</Text>}
            </TouchableOpacity>
            <View style={styles.footer}>
              <Text style={styles.footerText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Signup')} disabled={loading} data-testid="signup-link">
                <Text style={styles.linkText}>Sign Up</Text>
              </TouchableOpacity>
            </View>
            {__DEV__ && (
              <TouchableOpacity style={styles.testCredentials} onPress={fillTestAccount} disabled={loading} data-testid="test-account-btn">
                <Text style={styles.testTitle}>Tap to autofill test account</Text>
                <Text style={styles.testText}>admin@vara.com / vara_admin_2026</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  scrollContent: { flexGrow: 1 },
  content: { flex: 1, padding: 24, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 40 },
  logo: { fontSize: 48, fontWeight: '700', color: '#3B82F6', marginBottom: 12 },
  bonusBadge: { backgroundColor: '#10B981', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  bonusText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  title: { fontSize: 28, fontWeight: '600', color: '#1F2937', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#6B7280', textAlign: 'center', marginBottom: 32 },
  form: { width: '100%' },
  label: { fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 8 },
  input: { backgroundColor: '#fff', borderRadius: 8, padding: 14, fontSize: 16, color: '#1F2937', borderWidth: 1, borderColor: '#D1D5DB', marginBottom: 16 },
  passwordWrapper: { position: 'relative', justifyContent: 'center' },
  passwordInput: { paddingRight: 64 },
  passwordToggle: { position: 'absolute', right: 12, top: 0, bottom: 16, justifyContent: 'center', paddingHorizontal: 8 },
  passwordToggleText: { color: '#3B82F6', fontSize: 14, fontWeight: '600' },
  forgotPwdContainer: { alignItems: 'flex-end', marginTop: -8, marginBottom: 16 },
  forgotPwdText: { color: '#3B82F6', fontSize: 13, fontWeight: '500' },
  button: { backgroundColor: '#3B82F6', paddingVertical: 16, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  buttonDisabled: { backgroundColor: '#9CA3AF' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  buttonLoadingRow: { flexDirection: 'row', alignItems: 'center' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  footerText: { color: '#6B7280', fontSize: 14 },
  linkText: { color: '#3B82F6', fontSize: 14, fontWeight: '600' },
  testCredentials: { marginTop: 32, padding: 16, backgroundColor: '#EFF6FF', borderRadius: 8, borderWidth: 1, borderColor: '#BFDBFE', alignItems: 'center' },
  testTitle: { fontSize: 12, fontWeight: '600', color: '#1E40AF', marginBottom: 4 },
  testText: { fontSize: 12, color: '#3B82F6' },
});

export default LoginScreen;
