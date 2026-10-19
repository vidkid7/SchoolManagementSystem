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
import { refreshAuthTokens } from './tokenRefresh';

const API_URL = import.meta.env.VITE_API_URL || '';

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

    // Normalize short API paths to /api/v1/* so mixed call styles remain compatible
    if (config.url && config.url.startsWith('/') && !config.url.startsWith('/api/')) {
      config.url = '/api/v1' + config.url;
    }

    // Also check localStorage as fallback
    const localToken = localStorage.getItem('accessToken');
    const finalToken = localToken || state.auth.accessToken;

    if (finalToken) {
      config.headers.Authorization = `Bearer ${finalToken}`;
    }

    // Attach municipality header for tenant isolation
    const municipalityId = state.auth?.user?.municipalityId;
    if (municipalityId) {
      config.headers['X-Municipality-Id'] = municipalityId;
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

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 errors (unauthorized)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const { accessToken, refreshToken } = await refreshAuthTokens(API_URL);
        
        store.dispatch(setCredentials({
          accessToken,
          refreshToken,
        }));

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
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

