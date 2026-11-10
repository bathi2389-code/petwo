'use client';

import React, { useEffect, useState } from 'react';
import { TrendingUp, Users, Calendar, ShieldCheck, IndianRupee, AlertCircle, RefreshCw } from 'lucide-react';
import { apiClient, ADMIN_SESSION_KEY } from '@/lib/api-client';
import { formatCurrency } from '@/lib/utils';

type Metrics = {
  totalBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  totalCustomers: number;
  totalProviders: number;
  verifiedProviders: number;
  pendingProviders: number;
  grossMerchandiseValue: number;
  commissionRevenue: number;
  capturedPaymentsCount: number;
};

export default function AdminOverviewPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadMetrics() {
    try {
      const token = sessionStorage.getItem(ADMIN_SESSION_KEY);
      const response = await apiClient.get('/admin/analytics/overview', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMetrics(response.data?.data?.kpis ?? null);
      setError('');
    } catch {
      setError('Live marketplace analytics could not be loaded. Check your backend connection.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadMetrics();
    const interval = window.setInterval(() => void loadMetrics(), 30000);
    return () => window.clearInterval(interval);
  }, []);

  const cards = metrics ? [
    { label: 'Gross marketplace volume', value: formatCurrency(metrics.grossMerchandiseValue), note: 'From completed bookings', icon: IndianRupee, style: 'bg-teal-50 text-teal-700' },
    { label: 'Platform commission', value: formatCurrency(metrics.commissionRevenue), note: 'Recorded commission', icon: TrendingUp, style: 'bg-sky-50 text-sky-700' },
    { label: 'Total bookings', value: metrics.totalBookings.toLocaleString('en-IN'), note: `${metrics.completedBookings} completed · ${metrics.cancelledBookings} cancelled`, icon: Calendar, style: 'bg-indigo-50 text-indigo-700' },
    { label: 'Verified care partners', value: metrics.verifiedProviders.toLocaleString('en-IN'), note: `${metrics.totalProviders} registered providers`, icon: ShieldCheck, style: 'bg-emerald-50 text-emerald-700' },
    { label: 'Pending verifications', value: metrics.pendingProviders.toLocaleString('en-IN'), note: 'Awaiting admin review', icon: AlertCircle, style: 'bg-amber-50 text-amber-700' },
    { label: 'Registered pet parents', value: metrics.totalCustomers.toLocaleString('en-IN'), note: 'Customer profiles in Firebase', icon: Users, style: 'bg-violet-50 text-violet-700' },
  ] : [];

  return (
    <div className="space-y-7">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-teal-700">PETWO operations</p><h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Platform overview</h1><p className="mt-2 text-sm leading-6 text-slate-500">Live marketplace registrations and operational metrics</p></div>
        <button onClick={() => void loadMetrics()} className="inline-flex w-fit items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"><RefreshCw className="h-4 w-4" />Refresh</button>
      </section>
      {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
      {loading ? <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500">Loading live marketplace data…</div> : metrics ? (
        <section aria-label="Marketplace metrics" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {cards.map(({ label, value, note, icon: Icon, style }) => <article key={label} className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6"><div className="flex items-start justify-between gap-3"><p className="max-w-[220px] text-xs font-bold uppercase leading-5 tracking-[0.08em] text-slate-500">{label}</p><span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${style}`}><Icon className="h-5 w-5" /></span></div><p className="mt-5 text-3xl font-bold tracking-tight text-slate-950">{value}</p><p className="mt-2 text-xs font-medium text-slate-400">{note}</p></article>)}
        </section>
      ) : <div className="rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-500">No analytics data is available yet.</div>}
      {metrics && <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><h2 className="font-semibold text-slate-900">Marketplace control centre</h2><p className="mt-1 text-sm leading-6 text-slate-500">These figures are read from the PETWO backend and Firebase. Customer and provider lists refresh automatically on their respective pages.</p></section>}
    </div>
  );
}
