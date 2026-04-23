import axios from 'axios';
import { API_CONFIG } from '../config';
import AsyncStorage from '@react-native-async-storage/async-storage';

const api = axios.create({
  baseURL: API_CONFIG.BACKEND_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        const response = await axios.post(
          `${API_CONFIG.BACKEND_URL}/api/auth/refresh`,
          {},
          {
            headers: { Authorization: `Bearer ${refreshToken}` },
          }
        );

        const { access_token } = response.data;
        await AsyncStorage.setItem('accessToken', access_token);

        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return api(originalRequest);
      } catch (refreshError) {
        await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export const authAPI = {
  login: async (email, password) => {
    const response = await api.post('/api/auth/login', { email, password });
    return response.data;
  },

  register: async (email, password, name, referralCode) => {
    const payload = { email, password, name };
    if (referralCode && referralCode.trim()) {
      payload.referral_code = referralCode.trim().toUpperCase();
    }
    const response = await api.post('/api/auth/register', payload);
    return response.data;
  },

  logout: async () => {
    const response = await api.post('/api/auth/logout');
    await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
    return response.data;
  },

  getMe: async () => {
    const response = await api.get('/api/auth/me');
    return response.data;
  },
};

export const referralsAPI = {
  getMe: async () => {
    const response = await api.get('/api/referrals/me');
    return response.data;
  },
  validate: async (code) => {
    const response = await api.get(`/api/referrals/validate/${encodeURIComponent(code)}`);
    return response.data;
  },
  getLeaderboard: async (period = 'month', limit = 10) => {
    const response = await api.get(`/api/referrals/leaderboard?period=${period}&limit=${limit}`);
    return response.data;
  },
};

export const statsAPI = {
  totalPaidOut: async () => {
    const response = await api.get('/api/stats/total-paid-out');
    return response.data;
  },
  recentWithdrawals: async (limit = 10) => {
    const response = await api.get(`/api/stats/recent-withdrawals?limit=${limit}`);
    return response.data;
  },
};

export const tasksAPI = {
  getTasks: async () => {
    const response = await api.get('/api/tasks/');
    return response.data;
  },

  completeTask: async (taskId) => {
    const response = await api.post('/api/tasks/complete', { task_id: taskId });
    return response.data;
  },
};

export const withdrawalAPI = {
  requestWithdrawal: async (amount, method, details) => {
    const response = await api.post('/api/withdrawal/request', {
      amount,
      payment_method: method,
      account_details: details,
    });
    return response.data;
  },

  getHistory: async () => {
    const response = await api.get('/api/withdrawal/history');
    return response.data;
  },
};

export default api;
