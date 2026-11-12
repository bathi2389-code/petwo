'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  ShieldCheck, Check, X, Phone, Mail, RefreshCw, AlertCircle,
  Building2, MapPin, BadgeCheck, FileCheck2, Clock3,
} from 'lucide-react';
import { apiClient, ADMIN_SESSION_KEY, getApiErrorMessage } from '@/lib/api-client';
import { formatDate } from '@/lib/utils';

type Provider = {
  id: string;
  businessName: string;
  businessType: string;
  contact?: { phone?: string; email?: string };
  address?: { line1?: string; city?: string; state?: string; pincode?: string };
  registrationNo?: string;
  panNumber?: string;
  gstNumber?: string;
  verificationStatus: string;
  createdAt?: string;
};

const tabs = [
  { value: 'pending', label: 'Pending review' },
  { value: 'approved', label: 'Verified partners' },
  { value: 'rejected', label: 'Rejected' },
] as const;

export default function ProvidersAdminPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadProviders = useCallback(async (showSpinner = false) => {
    if (showSpinner) setRefreshing(true);
    try {
      const token = sessionStorage.getItem(ADMIN_SESSION_KEY);
      if (!token) throw new Error('Your admin session has expired. Sign in again.');
      const response = await apiClient.get('/admin/providers', {
        params: { status: activeTab, limit: 100 },
        headers: { Authorization: `Bearer ${token}` },
      });
      setProviders(Array.isArray(response.data?.data) ? response.data.data : []);
      setError('');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not load provider applications. Check the backend connection and try again.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab]);

  useEffect(() => {
    void loadProviders();
    const interval = window.setInterval(() => void loadProviders(), 30000);
    return () => window.clearInterval(interval);
  }, [loadProviders]);

  async function handleVerify(id: string, status: 'approved' | 'rejected') {
    const token = sessionStorage.getItem(ADMIN_SESSION_KEY);
    if (!token) {
      setError('Your admin session has expired. Sign in again.');
      return;
    }
    setBusyId(id);
    setError('');
    try {
      await apiClient.put(`/admin/providers/${encodeURIComponent(id)}/verify`, { status }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await loadProviders();
    } catch (err) {
      setError(getApiErrorMessage(err, 'The provider status could not be saved. Please refresh and try again.'));
    } finally {
      setBusyId('');
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-7">
      <section className="flex flex-col justify-between gap-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7 lg:flex-row lg:items-end">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-teal-50 px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[.14em] text-teal-800">
            <ShieldCheck className="h-3.5 w-3.5" /> Trust & safety
          </div>
          <h1 className="mt-4 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">Provider verification</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">Review business applications and control which care partners are published in the customer marketplace.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-slate-50 px-4 py-2.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Current queue</p>
            <p className="text-xl font-black tabular-nums text-slate-900">{loading ? '—' : providers.length}</p>
          </div>
          <button type="button" onClick={() => void loadProviders(true)} disabled={refreshing} className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:border-teal-200 hover:bg-teal-50 disabled:opacity-60">
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
      </section>

      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="inline-flex w-fit flex-wrap gap-1 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm" role="tablist" aria-label="Provider verification status">
          {tabs.map(tab => (
            <button key={tab.value} type="button" role="tab" aria-selected={activeTab === tab.value} onClick={() => setActiveTab(tab.value)}
              className={`rounded-xl px-4 py-2.5 text-xs font-bold transition sm:text-sm ${activeTab === tab.value ? 'bg-[#102f4d] text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'}`}>
              {tab.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-slate-400">Automatically refreshes every 30 seconds</p>
      </div>

      {error && <div role="alert" className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><p className="flex-1">{error}</p><button type="button" onClick={() => void loadProviders(true)} className="shrink-0 font-bold underline">Retry</button></div>}

      {loading ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {[0, 1, 2, 3].map(item => <div key={item} className="rounded-2xl border border-slate-200 bg-white p-6"><div className="h-5 w-1/2 animate-pulse rounded bg-slate-100" /><div className="mt-4 h-3 w-2/3 animate-pulse rounded bg-slate-100" /><div className="mt-8 h-10 animate-pulse rounded-xl bg-slate-100" /></div>)}
        </div>
      ) : providers.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 text-teal-800"><Building2 className="h-7 w-7" /></div>
          <h2 className="mt-5 text-lg font-black text-slate-900">No {activeTab === 'approved' ? 'verified' : activeTab} providers</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">{activeTab === 'pending' ? 'New provider applications will appear here when they complete registration.' : 'There are no provider records in this status right now.'}</p>
        </div>
      ) : (
        <div className="grid items-stretch gap-4 xl:grid-cols-2">
          {providers.map(provider => (
            <article key={provider.id} className="flex min-w-0 flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow-md sm:p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-teal-800"><Building2 className="h-6 w-6" /></div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="break-words text-base font-black text-slate-950 sm:text-lg">{provider.businessName || 'Unnamed business'}</h2>
                    {provider.verificationStatus === 'approved' && <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-extrabold text-emerald-800"><BadgeCheck className="h-3 w-3" /> Verified</span>}
                  </div>
                  <p className="mt-1 text-[10px] font-extrabold uppercase tracking-[.13em] text-teal-700">{(provider.businessType || 'provider').replace(/_/g, ' ')}</p>
                  <p className="mt-2 flex items-start gap-1.5 text-xs leading-5 text-slate-500"><MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />{[provider.address?.line1, provider.address?.city, provider.address?.state, provider.address?.pincode].filter(Boolean).join(', ') || 'Business address not provided'}</p>
                </div>
              </div>

              <div className="mt-5 grid gap-2 rounded-xl bg-slate-50 p-3 text-xs text-slate-600 sm:grid-cols-2">
                {provider.contact?.phone && <span className="flex min-w-0 items-center gap-2"><Phone className="h-3.5 w-3.5 shrink-0 text-slate-400" /><span className="truncate">{provider.contact.phone}</span></span>}
                {provider.contact?.email && <span className="flex min-w-0 items-center gap-2"><Mail className="h-3.5 w-3.5 shrink-0 text-slate-400" /><span className="truncate">{provider.contact.email}</span></span>}
                <span className="flex items-center gap-2 sm:col-span-2"><Clock3 className="h-3.5 w-3.5 shrink-0 text-slate-400" />Submitted {provider.createdAt ? formatDate(provider.createdAt) : 'date unavailable'}</span>
              </div>

              {(provider.registrationNo || provider.panNumber || provider.gstNumber) && <div className="mt-4 flex flex-wrap gap-2 text-[10px]">
                {provider.registrationNo && <span className="rounded-lg border border-blue-100 bg-blue-50 px-2.5 py-1.5 font-semibold text-blue-800">Registration: {provider.registrationNo}</span>}
                {provider.panNumber && <span className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 font-semibold text-slate-700">PAN: {provider.panNumber}</span>}
                {provider.gstNumber && <span className="rounded-lg border border-emerald-100 bg-emerald-50 px-2.5 py-1.5 font-semibold text-emerald-800">GSTIN: {provider.gstNumber}</span>}
              </div>}

              <div className="mt-auto flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <span className="max-w-full truncate font-mono text-[10px] text-slate-400" title={provider.id}>Provider UID: {provider.id}</span>
                {activeTab === 'pending' && <div className="grid grid-cols-2 gap-2 sm:flex sm:shrink-0">
                  <button type="button" disabled={busyId === provider.id} onClick={() => void handleVerify(provider.id, 'rejected')} className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-rose-200 px-4 py-2.5 text-xs font-bold text-rose-700 transition hover:bg-rose-50 disabled:opacity-50"><X className="h-4 w-4" /> Reject</button>
                  <button type="button" disabled={busyId === provider.id} onClick={() => void handleVerify(provider.id, 'approved')} className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50"><Check className="h-4 w-4" />{busyId === provider.id ? 'Saving…' : 'Approve'}</button>
                </div>}
              </div>
            </article>
          ))}
        </div>
      )}

      <p className="flex items-center gap-2 text-xs leading-5 text-slate-400"><FileCheck2 className="h-4 w-4 shrink-0" />Verification decisions are saved to Firestore and recorded in the audit log. Approval publishes an active provider to customer discovery.</p>
    </div>
  );
}
