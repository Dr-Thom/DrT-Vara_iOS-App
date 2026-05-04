/**
 * Defensive login helper — uses native fetch (no axios), wraps everything in
 * try/catch to prevent native crashes. Surfaces errors as plain strings so
 * they can be Alert'd without crashing on circular references.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../config';

async function safeJSON(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export async function safeLogin(email, password) {
  const url = `${API_CONFIG.BACKEND_URL}/api/auth/login`;
  let response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ email, password }),
    });
  } catch (e) {
    throw new Error(
      `Cannot reach VARA server. Check internet, then try again.\n(${(e && e.message) || 'network error'})`
    );
  }

  const data = await safeJSON(response);

  if (!response.ok) {
    const detail = (data && data.detail) || `Server returned ${response.status}`;
    throw new Error(typeof detail === 'string' ? detail : 'Login failed');
  }

  if (!data || !data.access_token) {
    throw new Error('Server response missing access_token');
  }

  try {
    await AsyncStorage.setItem('accessToken', data.access_token);
    if (data.refresh_token) {
      await AsyncStorage.setItem('refreshToken', data.refresh_token);
    }
    await AsyncStorage.setItem('user', JSON.stringify(data));
  } catch (e) {
    // Storage failure is non-fatal for this session
    // eslint-disable-next-line no-console
    console.warn('AsyncStorage set failed:', e?.message);
  }

  return data;
}

export async function safeRegister(email, password, name, referralCode) {
  const url = `${API_CONFIG.BACKEND_URL}/api/auth/register`;
  const payload = { email, password, name };
  if (referralCode && referralCode.trim()) {
    payload.referral_code = referralCode.trim().toUpperCase();
  }
  let response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (e) {
    throw new Error(`Cannot reach VARA server. (${(e && e.message) || 'network error'})`);
  }
  const data = await safeJSON(response);
  if (!response.ok) {
    const detail = (data && data.detail) || `Server returned ${response.status}`;
    throw new Error(typeof detail === 'string' ? detail : 'Signup failed');
  }
  if (!data || !data.access_token) {
    throw new Error('Server response missing access_token');
  }
  try {
    await AsyncStorage.setItem('accessToken', data.access_token);
    if (data.refresh_token) await AsyncStorage.setItem('refreshToken', data.refresh_token);
    await AsyncStorage.setItem('user', JSON.stringify(data));
  } catch { /* non-fatal */ }
  return data;
}
