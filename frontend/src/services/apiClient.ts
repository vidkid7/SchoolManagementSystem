/**
 * API Client
 * 
 * Axios instance with interceptors for API requests
 * Supports lite mode with request queuing
 */

import axios from 'axios';
import { store } from '../store';
import { logout, setCredentials } from '../store/slices/authSlice';
import { requestQueue } from '../utils/requestQueue';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    const state = store.getState();
    const token = state.auth.accessToken;

    // Also check localStorage as fallback
    const localToken = localStorage.getItem('accessToken');
    const finalToken = token || localToken;

    if (finalToken) {
      config.headers.Authorization = `Bearer ${finalToken}`;
    }

    // Update request queue based on lite mode
    const liteModeEnabled = state.liteMode?.enabled || false;
    requestQueue.setLiteMode(liteModeEnabled);

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Track if we're already refreshing to prevent duplicate refresh requests
let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

// Subscribe to token refresh
const subscribeTokenRefresh = (cb: (token: string) => void) => {
  refreshSubscribers.push(cb);
};

// Notify all waiting requests of new token
const onTokenRefreshed = (token: string) => {
  refreshSubscribers.forEach(cb => cb(token));
  refreshSubscribers = [];
};

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 errors (unauthorized)
    if (error.response?.status === 401 && !originalRequest._retry) {
      // If already refreshing, wait for the new token
      if (isRefreshing) {
        return new Promise((resolve) => {
          subscribeTokenRefresh((token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(apiClient(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Try to refresh the token
        const refreshToken = localStorage.getItem('refreshToken');
        
        if (refreshToken) {
          const response = await axios.post(`${API_URL}/api/v1/auth/refresh`, {
            refreshToken,
          });

          const { accessToken, refreshToken: newRefreshToken } = response.data.data;

          // Store new tokens in both localStorage and Redux
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', newRefreshToken);
          
          // Update Redux store
          store.dispatch(setCredentials({
            accessToken,
            refreshToken: newRefreshToken,
          }));

          // Notify waiting requests
          onTokenRefreshed(accessToken);

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          isRefreshing = false;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        isRefreshing = false;
        // Refresh failed, logout user
        store.dispatch(logout());
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;