import React, { useState } from 'react';
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

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      await login(email.toLowerCase().trim(), password);
    } catch (error) {
      const msg = (error && error.message) ? String(error.message) : 'Login failed';
      Alert.alert('Login Failed', msg);
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
              <Text style={styles.bonusText}>$1 Bonus</Text>
            </View>
          </View>

          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Log in to continue earning</Text>

          <View style={styles.form}>
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
                placeholder="Enter your password"
                placeholderTextColor="#9CA3AF"
                value={password}
                onChangeText={(t) => {
                  if (__DEV__) console.log('[LoginScreen] password length:', t.length);
                  setPassword(t);
                }}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                spellCheck={false}
                autoComplete="password"
                textContentType="password"
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
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              <Text style={styles.buttonText}>{loading ? 'Logging in...' : 'Log In'}</Text>
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
                <Text style={styles.linkText}>Sign Up</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.testCredentials}>
              <Text style={styles.testTitle}>Test Account:</Text>
              <Text style={styles.testText}>admin@vara.com / vara_admin_2026</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    fontSize: 48,
    fontWeight: '700',
    color: '#3B82F6',
    marginBottom: 12,
  },
  bonusBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  bonusText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
  },
  form: {
    width: '100%',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    color: '#1F2937',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    marginBottom: 16,
  },
  passwordWrapper: {
    position: 'relative',
    justifyContent: 'center',
  },
  passwordInput: {
    paddingRight: 64,
  },
  passwordToggle: {
    position: 'absolute',
    right: 12,
    top: 0,
    bottom: 16,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  passwordToggleText: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    color: '#6B7280',
    fontSize: 14,
  },
  linkText: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '600',
  },
  testCredentials: {
    marginTop: 32,
    padding: 16,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  testTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: 4,
  },
  testText: {
    fontSize: 12,
    color: '#3B82F6',
  },
});

export default LoginScreen;
