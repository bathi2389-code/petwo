import axios from 'axios';

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

