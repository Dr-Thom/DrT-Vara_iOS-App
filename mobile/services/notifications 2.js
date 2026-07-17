/**
 * Push notification registration + handlers.
 *
 * Flow:
 *  1. After login, call registerForPushNotifications() — requests perms,
 *     fetches the Expo push token, sends it to the backend.
 *  2. Foreground listener shows in-app banners (default Expo behavior).
 *  3. Tap listener routes to the right screen via `data.deepLink`.
 *
 * IMPORTANT: requires a development build (not Expo Go) and Firebase
 * google-services.json configured in app.json for Android delivery.
 */
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { usersAPI } from './api';

// Show banners + sound when a notification arrives in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const STORED_TOKEN_KEY = 'expoPushToken';

async function ensureAndroidChannel() {
  if (Platform.OS !== 'android') return;
  try {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'SAMSON',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#1E3A8A',
    });
  } catch (e) {
    console.warn('Failed to set Android channel:', e?.message);
  }
}

async function getProjectId() {
  return (
    Constants?.expoConfig?.extra?.eas?.projectId ||
    Constants?.easConfig?.projectId ||
    null
  );
}

function deviceTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

/**
 * Register for push and send token to backend.
 * Safe to call multiple times — only re-sends if the token changed.
 * Returns the Expo push token string, or null on failure (silent — never throws).
 */
export async function registerForPushNotifications() {
  try {
    if (!Device.isDevice) {
      console.log('[push] Skipped — not a physical device');
      return null;
    }

    await ensureAndroidChannel();

    // Permissions
    const { status: existing } = await Notifications.getPermissionsAsync();
    let final = existing;
    if (existing !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      final = status;
    }
    if (final !== 'granted') {
      console.log('[push] Permission denied');
      return null;
    }

    const projectId = await getProjectId();
    const tokenResp = projectId
      ? await Notifications.getExpoPushTokenAsync({ projectId })
      : await Notifications.getExpoPushTokenAsync();
    const token = tokenResp?.data;
    if (!token) return null;

    // Only re-send if changed
    const cached = await AsyncStorage.getItem(STORED_TOKEN_KEY);
    if (cached === token) {
      return token;
    }

    try {
      await usersAPI.registerPushToken(token, Platform.OS, deviceTimezone());
      await AsyncStorage.setItem(STORED_TOKEN_KEY, token);
      console.log('[push] Token registered with backend');
    } catch (e) {
      console.warn('[push] Backend register failed:', e?.message);
      // Don't cache so we'll retry next launch
    }

    return token;
  } catch (e) {
    console.warn('[push] register error:', e?.message);
    return null;
  }
}

/**
 * Tell backend to forget the token (called on logout).
 */
export async function unregisterPushNotifications() {
  try {
    await usersAPI.unregisterPushToken();
  } catch (e) {
    // ignore — user is logging out anyway
  }
  await AsyncStorage.removeItem(STORED_TOKEN_KEY);
}

/**
 * Wire foreground + tap listeners. Pass a `navigate(screenName, params?)` fn
 * for deep linking. Returns a cleanup fn.
 */
export function attachNotificationListeners(navigate) {
  const recvSub = Notifications.addNotificationReceivedListener(() => {
    // Default banner is shown by setNotificationHandler above. No-op here.
  });

  const respSub = Notifications.addNotificationResponseReceivedListener((response) => {
    try {
      const data = response?.notification?.request?.content?.data || {};
      const deep = data.deepLink || '';
      // vara://tasks → "tasks", vara://referrals → "referrals", etc.
      const m = /^vara:\/\/([\w\-]+)/i.exec(deep);
      if (!m || typeof navigate !== 'function') return;
      const target = m[1].toLowerCase();
      const route =
        target === 'tasks' ? 'Tasks'
        : target === 'referrals' ? 'Referrals'
        : target === 'withdrawal' ? 'Withdrawal'
        : 'Dashboard';
      navigate(route);
    } catch (e) {
      console.warn('[push] tap handler error:', e?.message);
    }
  });

  return () => {
    recvSub.remove();
    respSub.remove();
  };
}
