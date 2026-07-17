import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../services/api';
import { registerForPushNotifications, unregisterPushNotifications } from '../services/notifications';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (token) {
        const userData = await authAPI.getMe();
        setUser(userData);
        // Refresh push token registration on app open
        registerForPushNotifications().catch(() => {});
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    // Use fetch-based safe login to avoid axios/Hermes native crashes on Android
    const { safeLogin } = require('../services/safeAuth');
    const data = await safeLogin(email, password);
    setUser(data);
    // Fire-and-forget push registration after successful auth
    registerForPushNotifications().catch(() => {});
    return data;
  };

  const register = async (email, password, name, referralCode) => {
    const { safeRegister } = require('../services/safeAuth');
    const data = await safeRegister(email, password, name, referralCode);
    setUser(data);
    registerForPushNotifications().catch(() => {});
    return data;
  };

  const logout = async () => {
    try {
      await unregisterPushNotifications();
    } catch (e) {
      // non-fatal
    }
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
    setUser(null);
    await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
  };

  const refreshUser = async () => {
    await checkAuth();
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
