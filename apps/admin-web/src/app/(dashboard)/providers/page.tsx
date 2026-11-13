'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { ShieldCheck, Check, X, Phone, Mail, RefreshCw, AlertCircle } from 'lucide-react';
import { apiClient, ADMIN_SESSION_KEY, getApiErrorMessage } from '@/lib/api-client';
import { formatDate } from '@/lib/utils';

type Provider = {
  id: string;
  businessName: string;
  businessType: string;
  contact?: { phone?: string; email?: string };
  registrationNo?: string;
  panNumber?: string;
  gstNumber?: string;
  verificationStatus: string;
  createdAt?: string;
};

export default function ProvidersAdminPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadProviders = useCallback(async (showSpinner = false) => {
    if (showSpinner) setRefreshing(true);
    try {
      const response = await apiClient.get('/admin/providers', {
        params: { status: activeTab, limit: 100 },
      });
      setProviders(response.data?.data ?? []);
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
    let notes: string | undefined;
    if (status === 'rejected') {
      const reason = window.prompt('Enter a reason for rejecting this provider application:');
      if (reason === null) return;
      notes = reason.trim();
      if (!notes) {
        setError('Please enter a rejection reason so the provider record has an explanation.');
        return;
      }
    } else if (!window.confirm('Approve and verify this provider?')) {
      return;
    }

    setBusyId(id);
    setError('');
    setNotice('');
    try {
      await apiClient.put(`/admin/providers/${id}/verify`, { status, notes });
      setNotice(status === 'approved' ? 'Provider approved successfully.' : 'Provider rejected with the supplied reason.');
      await loadProviders();
    } catch (err) {
      setError(getApiErrorMessage(err, 'The provider status could not be saved. Please refresh and try again.'));
    } finally {
      setBusyId('');
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-teal-700">Partner onboarding</p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Provider verification</h1>
          <p className="mt-2 text-sm text-slate-500">Review real provider applications from Firebase. New applications appear automatically.</p>
        </div>
        <button type="button" onClick={() => void loadProviders(true)} disabled={refreshing} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60">
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </section>

      <div className="flex flex-wrap gap-5 border-b border-slate-200">
        {(['pending', 'approved', 'rejected'] as const).map(tab => (
          <button key={tab} type="button" onClick={() => setActiveTab(tab)} aria-pressed={activeTab === tab}
            className={`border-b-2 pb-3 text-sm font-semibold capitalize transition ${activeTab === tab ? 'border-teal-600 text-teal-700' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
            {tab === 'pending' ? 'Pending review' : tab === 'approved' ? 'Verified partners' : 'Rejected'}
          </button>
        ))}
      </div>

      {error && <div role="alert" className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{error}</div>}
      {notice && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{notice}</div>}

      {loading ? <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500">Loading provider applications…</div> : providers.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <ShieldCheck className="mx-auto h-9 w-9 text-slate-300" />
          <p className="mt-3 font-semibold text-slate-800">No {activeTab} provider applications</p>
          <p className="mt-1 text-sm text-slate-500">Provider applications with this status will appear here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {providers.map(provider => (
            <article key={provider.id} className="flex flex-col justify-between gap-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 lg:flex-row lg:items-center">
              <div className="min-w-0 space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-lg font-bold text-slate-950">{provider.businessName || 'Unnamed practice'}</h2>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium capitalize text-slate-700">{(provider.businessType || 'provider').replace(/_/g, ' ')}</span>
                </div>
                <div className="flex flex-wrap gap-4 text-xs text-slate-500">
                  {provider.contact?.phone && <span className="inline-flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{provider.contact.phone}</span>}
                  {provider.contact?.email && <span className="inline-flex items-center gap-1"><Mail className="h-3.5 w-3.5" />{provider.contact.email}</span>}
                  <span>Submitted: {provider.createdAt ? formatDate(provider.createdAt) : '—'}</span>
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  {provider.registrationNo && <span className="rounded border border-blue-200 bg-blue-50 px-2.5 py-1 font-mono text-blue-700">Reg: {provider.registrationNo}</span>}
                  {provider.panNumber && <span className="rounded border border-slate-200 bg-slate-50 px-2.5 py-1 font-mono text-slate-700">PAN: {provider.panNumber}</span>}
                  {provider.gstNumber && <span className="rounded border border-emerald-200 bg-emerald-50 px-2.5 py-1 font-mono text-emerald-700">GSTIN: {provider.gstNumber}</span>}
                </div>
                <p className="font-mono text-[11px] text-slate-400">Firebase UID: {provider.id}</p>
              </div>
              {activeTab === 'pending' && (
                <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
                  <button type="button" disabled={busyId === provider.id} onClick={() => void handleVerify(provider.id, 'rejected')} className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-rose-200 px-4 py-2.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50">
                    <X className="h-4 w-4" /> Reject
                  </button>
                  <button type="button" disabled={busyId === provider.id} onClick={() => void handleVerify(provider.id, 'approved')} className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">
                    <Check className="h-4 w-4" />{busyId === provider.id ? 'Saving…' : 'Approve & verify'}
                  </button>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
      <p className="flex items-center gap-2 text-xs text-slate-400"><ShieldCheck className="h-4 w-4" />Verification changes are saved through the admin API and recorded in the audit log.</p>
    </div>
  );
}
