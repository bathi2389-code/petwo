import axios, { AxiosError } from 'axios';

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
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for unified error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ error: { code: string; message: string } }>) => {
    const message = error.response?.data?.error?.message ?? error.message;
    const code = error.response?.data?.error?.code ?? 'UNKNOWN';
    const status = error.response?.status;

    return Promise.reject({ message, code, status, raw: error });
  },
);

// ─── Typed API Helpers ────────────────────────────────────────────────────────

export const providerApi = {
  getProfile: () => apiClient.get('/providers/me'),
  updateProfile: (data: Record<string, unknown>) => apiClient.put('/providers/me', data),
  getLocations: () => apiClient.get('/providers/me/locations'),
  createLocation: (data: Record<string, unknown>) => apiClient.post('/providers/me/locations', data),
};

export const bookingApi = {
  getBookings: (params?: Record<string, string | number>) =>
    apiClient.get('/bookings/provider', { params }),
  getBooking: (id: string) => apiClient.get(`/bookings/${id}`),
  confirmBooking: (id: string) => apiClient.put(`/bookings/${id}/confirm`),
  updateStatus: (id: string, data: { status: string; note?: string }) =>
    apiClient.put(`/bookings/${id}/status`, data),
};

export const earningsApi = {
  getAnalytics: (params?: { from?: string; to?: string }) =>
    apiClient.get('/admin/analytics/provider', { params }),
  getSettlements: () => apiClient.get('/settlements'),
};

export const reviewApi = {
  getReviews: (params?: { page?: number; limit?: number }) =>
    apiClient.get('/reviews', { params }),
  respondToReview: (id: string, response: string) =>
    apiClient.put(`/reviews/${id}/response`, { response }),
};

export const serviceApi = {
  getServices: () => apiClient.get('/services'),
  createService: (data: Record<string, unknown>) => apiClient.post('/services', data),
  updateService: (id: string, data: Record<string, unknown>) =>
    apiClient.put(`/services/${id}`, data),
  deleteService: (id: string) => apiClient.delete(`/services/${id}`),
};
