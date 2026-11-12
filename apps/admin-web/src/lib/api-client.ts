import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

function resolveApiBaseUrl(configuredUrl?: string): string {
  const configured = configuredUrl?.trim() || 'http://localhost:4000/api/v1';
  const withScheme = /^https?:\/\//i.test(configured) ? configured : `https://${configured}`;
  const url = new URL(withScheme);
  if (url.pathname === '/' || url.pathname === '') url.pathname = '/api/v1';
  return url.toString().replace(/\/$/, '');
}

export const apiClient = axios.create({
  baseURL: resolveApiBaseUrl(process.env.NEXT_PUBLIC_API_URL),
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

export const ADMIN_SESSION_KEY = 'petwo_admin_id_token';
export const ADMIN_REFRESH_TOKEN_KEY = 'petwo_admin_refresh_token';

type RefreshResponse = {
  id_token: string;
  refresh_token: string;
};

type RetriableRequest = InternalAxiosRequestConfig & { _adminRetry?: boolean };

apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = sessionStorage.getItem(ADMIN_SESSION_KEY);
    if (token) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

let refreshInFlight: Promise<string | null> | null = null;

async function refreshAdminToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  const refreshToken = sessionStorage.getItem(ADMIN_REFRESH_TOKEN_KEY);
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!refreshToken || !apiKey) return null;

  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      const response = await fetch(
        `https://securetoken.googleapis.com/v1/token?key=${encodeURIComponent(apiKey)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: refreshToken }).toString(),
        },
      );
      if (!response.ok) return null;
      const data = await response.json() as RefreshResponse;
      if (!data.id_token || !data.refresh_token) return null;
      sessionStorage.setItem(ADMIN_SESSION_KEY, data.id_token);
      sessionStorage.setItem(ADMIN_REFRESH_TOKEN_KEY, data.refresh_token);
      return data.id_token;
    })().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

apiClient.interceptors.response.use(
  response => response,
  async (error: AxiosError) => {
    const request = error.config as RetriableRequest | undefined;
    if (error.response?.status !== 401 || !request || request._adminRetry) {
      return Promise.reject(error);
    }

    request._adminRetry = true;
    try {
      const token = await refreshAdminToken();
      if (!token) throw new Error('Admin session expired. Please sign in again.');
      request.headers = request.headers ?? {};
      request.headers.Authorization = `Bearer ${token}`;
      return apiClient(request);
    } catch (refreshError) {
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem(ADMIN_SESSION_KEY);
        sessionStorage.removeItem(ADMIN_REFRESH_TOKEN_KEY);
        window.location.assign('/login');
      }
      return Promise.reject(refreshError);
    }
  },
);

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const payload = error.response?.data as { error?: { message?: string }; message?: string } | undefined;
    return payload?.error?.message || payload?.message || error.message || fallback;
  }
  return error instanceof Error ? error.message : fallback;
}
