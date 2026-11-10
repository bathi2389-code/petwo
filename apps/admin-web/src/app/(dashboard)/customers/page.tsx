'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshCw, Search, Users, Mail, Calendar, PawPrint, AlertCircle } from 'lucide-react';
import { apiClient, ADMIN_SESSION_KEY } from '@/lib/api-client';
import { formatDate } from '@/lib/utils';

type Customer = {
  id: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  createdAt?: string;
  isActive?: boolean;
};

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadCustomers = useCallback(async (showSpinner = false) => {
    if (showSpinner) setRefreshing(true);
    try {
      const token = sessionStorage.getItem(ADMIN_SESSION_KEY);
      const response = await apiClient.get('/admin/customers', {
        params: { q: search || undefined, limit: 100 },
        headers: { Authorization: `Bearer ${token}` },
      });
      setCustomers(response.data?.data ?? []);
      setError('');
    } catch {
      setError('Could not load registered customers. Check the backend connection and try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search]);

  useEffect(() => {
    void loadCustomers();
    const interval = window.setInterval(() => void loadCustomers(), 30000);
    return () => window.clearInterval(interval);
  }, [loadCustomers]);

  const visibleCustomers = useMemo(() => customers, [customers]);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Pet Parents & Customers</h1>
          <p className="mt-1 text-sm text-slate-500">Live customer registrations from Firebase. This list refreshes automatically every 30 seconds.</p>
        </div>
        <button onClick={() => void loadCustomers(true)} disabled={refreshing} className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60">
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by customer name or email..." className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-4 text-sm outline-none focus:ring-2 focus:ring-teal-500" />
        </div>
        <div className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600">
          <Users className="h-4 w-4" /> {visibleCustomers.length} customers loaded
        </div>
      </div>

      {error && <div role="alert" className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{error}</div>}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-sm text-slate-500">Loading registered customers…</div>
        ) : visibleCustomers.length === 0 ? (
          <div className="p-12 text-center">
            <PawPrint className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-3 font-semibold text-slate-700">No registered customers found</p>
            <p className="mt-1 text-sm text-slate-500">New customer accounts will appear here after registration.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-600">
                <tr><th className="px-6 py-3.5">Customer</th><th className="px-6 py-3.5">Contact</th><th className="px-6 py-3.5">Account status</th><th className="px-6 py-3.5">Registered</th><th className="px-6 py-3.5">Firebase UID</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visibleCustomers.map(customer => {
                  const name = customer.displayName || [customer.firstName, customer.lastName].filter(Boolean).join(' ') || 'Customer';
                  return <tr key={customer.id} className="hover:bg-slate-50/70">
                    <td className="px-6 py-4 font-semibold text-slate-900">{name}</td>
                    <td className="px-6 py-4 text-xs text-slate-600"><div className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-slate-400" />{customer.email || '—'}</div>{customer.phone && <div className="mt-1">{customer.phone}</div>}</td>
                    <td className="px-6 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${customer.isActive === false ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}>{customer.isActive === false ? 'Inactive' : 'Active'}</span></td>
                    <td className="px-6 py-4 text-xs text-slate-600"><span className="inline-flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-slate-400" />{customer.createdAt ? formatDate(customer.createdAt) : '—'}</span></td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-500">{customer.id}</td>
                  </tr>;
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
