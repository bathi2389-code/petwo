'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Search, RefreshCw, Calendar, AlertCircle } from 'lucide-react';
import { apiClient, getApiErrorMessage } from '@/lib/api-client';
import { formatCurrency } from '@/lib/utils';

type BookingRecord = {
  id: string;
  bookingNumber?: string;
  customerId?: string;
  providerId?: string;
  petId?: string;
  serviceId?: string;
  status: string;
  scheduledAt?: string;
  pricing?: { totalAmount?: number };
  commission?: { amount?: number };
};

const statuses = ['all', 'pending_confirmation', 'confirmed', 'in_progress', 'completed', 'cancelled_by_customer', 'cancelled_by_provider', 'no_show', 'disputed', 'refunded'];

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadBookings = useCallback(async (showSpinner = false) => {
    if (showSpinner) setRefreshing(true);
    try {
      const response = await apiClient.get('/admin/bookings', { params: { page: 1, limit: 100, status: filter === 'all' ? undefined : filter } });
      setBookings(Array.isArray(response.data?.data) ? response.data.data : []);
      setError('');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not load marketplace bookings.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter]);

  useEffect(() => {
    void loadBookings();
    const interval = window.setInterval(() => void loadBookings(), 30000);
    return () => window.clearInterval(interval);
  }, [loadBookings]);

  const visibleBookings = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return bookings;
    return bookings.filter((booking) =>
      [booking.bookingNumber, booking.id, booking.customerId, booking.providerId, booking.petId, booking.serviceId]
        .some(value => String(value ?? '').toLowerCase().includes(term)),
    );
  }, [bookings, search]);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Platform Bookings & Orders</h1>
          <p className="mt-1 text-sm text-slate-500">Live booking records from the PETWO backend and Firestore.</p>
        </div>
        <button onClick={() => void loadBookings(true)} disabled={refreshing} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-60">
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />Refresh
        </button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative min-w-0 flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search booking number, customer ID, provider ID…" className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-4 text-sm outline-none focus:ring-2 focus:ring-teal-500" />
        </div>
        <select value={filter} onChange={event => setFilter(event.target.value)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm">
          {statuses.map(status => <option key={status} value={status}>{status === 'all' ? 'All statuses' : status.replace(/_/g, ' ')}</option>)}
        </select>
      </div>

      {error && <div role="alert" className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{error}</div>}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {loading ? <div className="p-12 text-center text-sm text-slate-500">Loading live bookings…</div> : visibleBookings.length === 0 ? (
          <div className="p-12 text-center"><Calendar className="mx-auto h-8 w-8 text-slate-300" /><p className="mt-3 font-semibold text-slate-700">No booking records found</p><p className="mt-1 text-sm text-slate-500">Bookings will appear here when customers make them.</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-600"><tr><th className="px-5 py-3">Booking</th><th className="px-5 py-3">Customer / Pet IDs</th><th className="px-5 py-3">Provider / Service IDs</th><th className="px-5 py-3">Scheduled</th><th className="px-5 py-3">Total</th><th className="px-5 py-3">Commission</th><th className="px-5 py-3">Status</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {visibleBookings.map(booking => <tr key={booking.id} className="hover:bg-slate-50/70">
                  <td className="px-5 py-4"><div className="font-mono text-xs font-semibold text-slate-900">{booking.bookingNumber || booking.id}</div><div className="mt-1 font-mono text-[10px] text-slate-400">{booking.id}</div></td>
                  <td className="px-5 py-4 text-xs text-slate-600"><div>{booking.customerId || '—'}</div><div className="mt-1 text-slate-400">{booking.petId || '—'}</div></td>
                  <td className="px-5 py-4 text-xs text-slate-600"><div>{booking.providerId || '—'}</div><div className="mt-1 text-slate-400">{booking.serviceId || '—'}</div></td>
                  <td className="px-5 py-4 text-xs text-slate-600">{booking.scheduledAt ? new Date(booking.scheduledAt).toLocaleString('en-IN') : '—'}</td>
                  <td className="px-5 py-4 font-semibold text-slate-900">{formatCurrency(booking.pricing?.totalAmount ?? 0)}</td>
                  <td className="px-5 py-4 font-medium text-emerald-700">{formatCurrency(booking.commission?.amount ?? 0)}</td>
                  <td className="px-5 py-4"><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold capitalize text-slate-700">{booking.status.replace(/_/g, ' ')}</span></td>
                </tr>)}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <p className="text-xs text-slate-400">Showing up to 100 records per selected status. Refreshes automatically every 30 seconds.</p>
    </div>
  );
}
