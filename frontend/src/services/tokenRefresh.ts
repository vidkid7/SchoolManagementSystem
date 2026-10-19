import axios from 'axios';

export interface RefreshedTokens {
  accessToken: string;
  refreshToken: string;
}

let refreshPromise: Promise<RefreshedTokens> | null = null;

function normalizeApiBaseUrl(apiBaseUrl: string): string {
  const baseUrl = apiBaseUrl.replace(/\/+$/, '');
  if (!baseUrl || baseUrl === '/') return '/api/v1';
  return baseUrl.endsWith('/api/v1') ? baseUrl : `${baseUrl}/api/v1`;
}

/** Share one rotating refresh-token request across both Axios clients. */
export function refreshAuthTokens(apiBaseUrl: string): Promise<RefreshedTokens> {
  if (refreshPromise) return refreshPromise;

  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) return Promise.reject(new Error('No refresh token'));

  const endpoint = `${normalizeApiBaseUrl(apiBaseUrl)}/auth/refresh`;
  refreshPromise = axios
    .post(endpoint, { refreshToken }, { withCredentials: true })
    .then((response) => {
      const tokens = response.data?.data as RefreshedTokens | undefined;
      if (!tokens?.accessToken || !tokens.refreshToken) {
        throw new Error('Refresh response did not include both tokens');
      }

      localStorage.setItem('accessToken', tokens.accessToken);
      localStorage.setItem('refreshToken', tokens.refreshToken);
      return tokens;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}
