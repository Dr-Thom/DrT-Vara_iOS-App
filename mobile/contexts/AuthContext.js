import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../services/api';

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
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const data = await authAPI.login(email, password);
    // Save tokens for mobile (cookies aren't readable)
    if (data.access_token) {
      await AsyncStorage.setItem('accessToken', data.access_token);
    }
    if (data.refresh_token) {
      await AsyncStorage.setItem('refreshToken', data.refresh_token);
    }
    setUser(data);
    await AsyncStorage.setItem('user', JSON.stringify(data));
    return data;
  };

  const register = async (email, password, name) => {
    const data = await authAPI.register(email, password, name);
    // Save tokens for mobile (cookies aren't readable)
    if (data.access_token) {
      await AsyncStorage.setItem('accessToken', data.access_token);
    }
    if (data.refresh_token) {
      await AsyncStorage.setItem('refreshToken', data.refresh_token);
    }
    setUser(data);
    await AsyncStorage.setItem('user', JSON.stringify(data));
    return data;
  };

  const logout = async () => {
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
