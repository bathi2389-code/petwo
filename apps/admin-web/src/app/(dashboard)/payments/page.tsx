'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { CreditCard, RefreshCw, AlertCircle, IndianRupee } from 'lucide-react';
import { apiClient, getApiErrorMessage } from '@/lib/api-client';
import { formatCurrency } from '@/lib/utils';

type PaymentRecord = {
  id: string;
  bookingId?: string;
  customerId?: string;
  providerId?: string;
  gatewayPaymentId?: string;
  amount?: number;
  currency?: string;
  method?: string;
  status: string;
  createdAt?: string;
};

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadPayments = useCallback(async (showSpinner = false) => {
    if (showSpinner) setRefreshing(true);
    try {
      const response = await apiClient.get('/admin/payments', { params: { page: 1, limit: 100 } });
      setPayments(Array.isArray(response.data?.data) ? response.data.data : []);
      setError('');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not load payment records.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadPayments();
    const interval = window.setInterval(() => void loadPayments(), 30000);
    return () => window.clearInterval(interval);
  }, [loadPayments]);

  const totalRecorded = payments.reduce((sum, payment) => sum + (payment.amount ?? 0), 0);
  const capturedCount = payments.filter(payment => payment.status === 'captured').length;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div><h1 className="text-2xl font-bold text-slate-900">Payment Records</h1><p className="mt-1 text-sm text-slate-500">Historical payment records retrieved from PETWO Firestore.</p></div>
        <button onClick={() => void loadPayments(true)} disabled={refreshing} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-60"><RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />Refresh</button>
      </div>

      <div role="note" className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">Payment collection and Razorpay checkout remain disabled for the MVP. This page is read-only and displays only payment documents already stored in Firestore.</div>
      {error && <div role="alert" className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{error}</div>}

      {!loading && !error && <div className="grid gap-4 sm:grid-cols-2"><article className="rounded-xl border border-slate-200 bg-white p-5"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Records loaded</p><p className="mt-2 text-2xl font-bold text-slate-900">{payments.length.toLocaleString('en-IN')}</p></article><article className="rounded-xl border border-slate-200 bg-white p-5"><p className="flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-slate-500"><IndianRupee className="h-3.5 w-3.5" /> Recorded amount (loaded records)</p><p className="mt-2 text-2xl font-bold text-slate-900">{formatCurrency(totalRecorded)}</p><p className="mt-1 text-xs text-slate-500">{capturedCount} captured records</p></article></div>}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {loading ? <div className="p-12 text-center text-sm text-slate-500">Loading payment records…</div> : payments.length === 0 ? <div className="p-12 text-center"><CreditCard className="mx-auto h-8 w-8 text-slate-300" /><p className="mt-3 font-semibold text-slate-700">No payment records found</p><p className="mt-1 text-sm text-slate-500">This is expected while payment collection is disabled.</p></div> : (
          <div className="overflow-x-auto"><table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-600"><tr><th className="px-5 py-3">Payment ID</th><th className="px-5 py-3">Booking ID</th><th className="px-5 py-3">Customer ID</th><th className="px-5 py-3">Method</th><th className="px-5 py-3">Amount</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Created</th></tr></thead>
            <tbody className="divide-y divide-slate-100">{payments.map(payment => <tr key={payment.id} className="hover:bg-slate-50/70">
              <td className="px-5 py-4 font-mono text-xs font-semibold text-slate-900">{payment.gatewayPaymentId || payment.id}</td><td className="px-5 py-4 font-mono text-xs text-slate-600">{payment.bookingId || '—'}</td><td className="px-5 py-4 font-mono text-xs text-slate-600">{payment.customerId || '—'}</td><td className="px-5 py-4 text-xs capitalize text-slate-600">{payment.method || '—'}</td><td className="px-5 py-4 font-semibold text-slate-900">{formatCurrency(payment.amount ?? 0)}</td><td className="px-5 py-4"><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold capitalize text-slate-700">{payment.status.replace(/_/g, ' ')}</span></td><td className="px-5 py-4 text-xs text-slate-500">{payment.createdAt ? new Date(payment.createdAt).toLocaleString('en-IN') : '—'}</td>
            </tr>)}</tbody>
          </table></div>
        )}
      </div>
    </div>
  );
}
