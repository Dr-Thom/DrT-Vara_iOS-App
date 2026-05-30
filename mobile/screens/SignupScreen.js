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
    if (!email || !password || !name) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await register(email.toLowerCase(), password, name, referralCode);
    } catch (error) {
      Alert.alert('Signup Failed', error.response?.data?.detail || 'Registration failed');
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
              value={name}
              onChangeText={setName}
            />

            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="your@email.com"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="At least 6 characters"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

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
  input: { backgroundColor: '#fff', borderRadius: 8, padding: 14, fontSize: 16, borderWidth: 1, borderColor: '#D1D5DB', marginBottom: 16 },
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
