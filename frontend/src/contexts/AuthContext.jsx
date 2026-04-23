import React, { createContext, useState, useContext, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import API_CONFIG from '../config/api';

const AuthContext = createContext(null);

// Setup axios interceptor for automatic token refresh
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Add response interceptor to handle 401 and refresh token
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't tried to refresh yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => axios(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Attempt to refresh the token
        await axios.post(
          `${API_CONFIG.BACKEND_URL}/api/auth/refresh`,
          {},
          { withCredentials: true }
        );
        
        processQueue(null);
        isRefreshing = false;
        
        // Retry the original request
        return axios(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        isRefreshing = false;
        
        // Refresh failed, user needs to login again
        // Don't redirect here, let the component handle it
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      const response = await axios.get(
        `${API_CONFIG.BACKEND_URL}/api/auth/me`,
        { withCredentials: true }
      );
      setUser(response.data);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Check if user is already logged in
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (email, password) => {
    const response = await axios.post(
      `${API_CONFIG.BACKEND_URL}/api/auth/login`,
      { email, password },
      { withCredentials: true }
    );
    setUser(response.data);
    return response.data;
  };

  const signup = async (email, password, name, referralCode) => {
    const payload = { email, password, name };
    if (referralCode && referralCode.trim()) {
      payload.referral_code = referralCode.trim().toUpperCase();
    }
    const response = await axios.post(
      `${API_CONFIG.BACKEND_URL}/api/auth/register`,
      payload,
      { withCredentials: true }
    );
    setUser(response.data);
    return response.data;
  };

  const logout = async () => {
    try {
      await axios.post(
        `${API_CONFIG.BACKEND_URL}/api/auth/logout`,
        {},
        { withCredentials: true }
      );
    } catch (error) {
      // Silently handle logout errors
    }
    setUser(null);
  };

  const refreshUser = useCallback(async () => {
    await checkAuth();
  }, [checkAuth]);

  // Memoize context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    user,
    loading,
    login,
    signup,
    logout,
    refreshUser
  }), [user, loading, refreshUser]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
