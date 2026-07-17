import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { referralsAPI } from '../services/api';

const SignupScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [referralStatus, setReferralStatus] = useState(null); // null | 'valid' | 'invalid'
  const [referrerName, setReferrerName] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();

  useEffect(() => {
    const code = (referralCode || '').trim().toUpperCase();
    if (code.length < 4) {
      setReferralStatus(null);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const r = await referralsAPI.validate(code);
        if (r?.valid) {
          setReferralStatus('valid');
          setReferrerName(r.referrer_name || 'a SAMSON user');
        } else {
          setReferralStatus('invalid');
        }
      } catch {
        setReferralStatus('invalid');
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [referralCode]);

  const handleSignup = async () => {
    // Trim inputs before validation
    const trimmedEmail = (email || '').trim().toLowerCase();
    const trimmedName = (name || '').trim();
    const trimmedReferral = (referralCode || '').trim().toUpperCase();

    if (!trimmedEmail || !password || !trimmedName) {
      Alert.alert('Missing info', 'Please fill in your name, email, and password.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      Alert.alert('Invalid email', 'Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Weak password', 'Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    try {
      await register(trimmedEmail, password, trimmedName, trimmedReferral);
    } catch (error) {
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.log('[SignupScreen] register error:', {
          message: error?.message,
          responseDetail: error?.response?.data?.detail,
          status: error?.response?.status,
        });
      }
      // safeAuth throws plain `Error(message)`; axios throws with `response.data.detail`.
      // Read message first, fall back to axios shape, then generic.
      const raw =
        (typeof error?.message === 'string' && error.message) ||
        (typeof error?.response?.data?.detail === 'string' && error.response.data.detail) ||
        '';
      const rawLower = raw.toLowerCase();

      // Map known backend/network errors to user-safe copy.
      let title = 'Signup Failed';
      let message = raw || 'Registration failed. Please try again.';

      if (rawLower.includes('already registered') || rawLower.includes('already exists')) {
        title = 'Account exists';
        message = 'This email already has an account. Please tap Log In.';
      } else if (rawLower.includes('valid email') || rawLower.includes('@-sign')) {
        title = 'Invalid email';
        message = 'Please enter a valid email address.';
      } else if (rawLower.includes('password') && rawLower.includes('6')) {
        title = 'Weak password';
        message = 'Password must be at least 6 characters.';
      } else if (rawLower.includes('cannot reach') || rawLower.includes('network')) {
        title = 'Connection problem';
        message = 'Please check your internet connection and try again.';
      } else if (rawLower.includes('server returned 5')) {
        title = 'Server error';
        message = 'Signup is temporarily unavailable. Please send your tester email to support@samsonusd.com.';
      }

      Alert.alert(title, message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.logo}>SAMSON</Text>
            <View style={styles.bonusBadge}>
              <Text style={styles.bonusText}>$1 bonus at 5 tasks</Text>
            </View>
          </View>

          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Start earning USD from your phone</Text>

          <View style={styles.form}>
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Your name"
              placeholderTextColor="#9CA3AF"
              value={name}
              onChangeText={setName}
              autoComplete="name"
              textContentType="name"
            />

            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="your@email.com"
              placeholderTextColor="#9CA3AF"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              autoComplete="email"
              textContentType="emailAddress"
            />

            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordWrapper}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                placeholder="At least 6 characters"
                placeholderTextColor="#9CA3AF"
                value={password}
                onChangeText={(t) => {
                  if (__DEV__) console.log('[SignupScreen] password length:', t.length);
                  setPassword(t);
                }}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                spellCheck={false}
                autoComplete="password-new"
                textContentType="newPassword"
                importantForAutofill="yes"
              />
              <TouchableOpacity
                style={styles.passwordToggle}
                onPress={() => setShowPassword((v) => !v)}
                accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
              >
                <Text style={styles.passwordToggleText}>{showPassword ? 'Hide' : 'Show'}</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Referral Code (optional)</Text>
            <TextInput
              style={[
                styles.input,
                referralStatus === 'valid' && styles.inputValid,
                referralStatus === 'invalid' && styles.inputInvalid,
              ]}
              placeholder="e.g. ABCD1234"
              value={referralCode}
              onChangeText={(t) => setReferralCode(t.toUpperCase())}
              autoCapitalize="characters"
              maxLength={12}
            />
            {referralStatus === 'valid' && (
              <Text style={styles.validText}>✓ Referred by {referrerName}</Text>
            )}
            {referralStatus === 'invalid' && (
              <Text style={styles.invalidText}>Invalid code — leave blank to skip</Text>
            )}

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleSignup}
              disabled={loading}
            >
              <Text style={styles.buttonTextStyle}>{loading ? 'Creating...' : 'Sign Up'}</Text>
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.linkText}>Log In</Text>
              </TouchableOpacity>
            </View>
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
  header: { alignItems: 'center', marginBottom: 32 },
  logo: { fontSize: 48, fontWeight: '700', color: '#3B82F6', marginBottom: 12 },
  bonusBadge: { backgroundColor: '#10B981', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  bonusText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  title: { fontSize: 28, fontWeight: '600', color: '#1F2937', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#6B7280', textAlign: 'center', marginBottom: 32 },
  form: { width: '100%' },
  label: { fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 8 },
  input: { backgroundColor: '#fff', borderRadius: 8, padding: 14, fontSize: 16, color: '#1F2937', borderWidth: 1, borderColor: '#D1D5DB', marginBottom: 16 },
  passwordWrapper: { position: 'relative', justifyContent: 'center' },
  passwordInput: { paddingRight: 64 },
  passwordToggle: { position: 'absolute', right: 12, top: 0, bottom: 16, justifyContent: 'center', paddingHorizontal: 8 },
  passwordToggleText: { color: '#3B82F6', fontSize: 14, fontWeight: '600' },
  inputValid: { borderColor: '#10B981', borderWidth: 2 },
  inputInvalid: { borderColor: '#EF4444', borderWidth: 2 },
  validText: { color: '#059669', fontSize: 13, marginTop: -12, marginBottom: 16, fontWeight: '600' },
  invalidText: { color: '#DC2626', fontSize: 13, marginTop: -12, marginBottom: 16 },
  button: { backgroundColor: '#3B82F6', paddingVertical: 16, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  buttonDisabled: { backgroundColor: '#9CA3AF' },
  buttonTextStyle: { color: '#fff', fontSize: 16, fontWeight: '600' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  footerText: { color: '#6B7280', fontSize: 14 },
  linkText: { color: '#3B82F6', fontSize: 14, fontWeight: '600' },
});

export default SignupScreen;
