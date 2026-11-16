'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, RefreshCw, ShieldCheck, Star, XCircle } from 'lucide-react';
import { apiClient, getApiErrorMessage } from '@/lib/api-client';
import { formatDate } from '@/lib/utils';

type Review = {
  id: string;
  bookingId: string;
  providerId: string;
  customerId: string;
  rating: number;
  title?: string;
  body?: string;
  status: 'pending' | 'published' | 'flagged' | 'removed';
  isVerified: boolean;
  createdAt: string;
};

const tabs = ['pending', 'published', 'flagged', 'removed'] as const;

export default function AdminReviewsPage() {
  const [status, setStatus] = useState<typeof tabs[number]>('pending');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await apiClient.get('/admin/reviews', { params: { status, limit: 100 } });
      setReviews(response.data?.data ?? []);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not load the review moderation queue.'));
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => { void load(); }, [load]);

  async function moderate(review: Review, nextStatus: 'published' | 'flagged' | 'removed') {
    const note = nextStatus === 'published' ? undefined : window.prompt('Add a moderation note (required):');
    if (nextStatus !== 'published' && (note === null || !note.trim())) return;
    if (nextStatus === 'published' && !window.confirm('Publish this verified-booking review?')) return;
    setBusyId(review.id);
    setError('');
    setNotice('');
    try {
      await apiClient.put(`/reviews/${review.id}/status`, { status: nextStatus, adminNote: note?.trim() });
      setNotice(`Review ${nextStatus} successfully.`);
      await load();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not update review status.'));
    } finally {
      setBusyId('');
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-700">Trust & safety</p>
          <h1 className="mt-1 text-3xl font-bold text-slate-950">Reviews & reputation</h1>
          <p className="mt-2 text-sm text-slate-500">Moderate customer feedback linked to completed PETWO bookings. AI never changes star ratings.</p>
        </div>
        <button onClick={() => void load()} className="inline-flex items-center gap-2 rounded-lg border bg-white px-4 py-2 text-sm font-semibold"><RefreshCw className="h-4 w-4" />Refresh</button>
      </header>
      <div className="flex flex-wrap gap-5 border-b">
        {tabs.map(tab => <button key={tab} onClick={() => setStatus(tab)} className={`border-b-2 pb-3 text-sm font-semibold capitalize ${status === tab ? 'border-teal-600 text-teal-700' : 'border-transparent text-slate-500'}`}>{tab}</button>)}
      </div>
      {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700"><AlertCircle className="mr-2 inline h-4 w-4" />{error}</p>}
      {notice && <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}
      {loading ? <p className="rounded-xl border bg-white p-10 text-center text-sm text-slate-500">Loading reviews…</p> : reviews.length === 0 ? <p className="rounded-xl border bg-white p-10 text-center text-sm text-slate-500">No {status} reviews.</p> : <div className="space-y-4">
        {reviews.map(review => <article key={review.id} className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2"><span className="font-semibold text-slate-900">{review.rating}/5</span><span className="flex text-amber-500">{[1,2,3,4,5].map(n => <Star key={n} className={`h-4 w-4 ${n <= review.rating ? 'fill-amber-400' : 'text-slate-200'}`} />)}</span>{review.isVerified && <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs text-emerald-700"><CheckCircle2 className="mr-1 inline h-3 w-3" />Completed booking</span>}</div>
            <span className="text-xs capitalize text-slate-500">{review.status} · {formatDate(review.createdAt)}</span>
          </div>
          {review.title && <h2 className="mt-3 font-semibold text-slate-900">{review.title}</h2>}
          <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{review.body || 'Star rating only; no written comment.'}</p>
          <p className="mt-3 text-xs text-slate-400">Provider: {review.providerId} · Booking: {review.bookingId} · Customer: {review.customerId}</p>
          {status !== 'removed' && <div className="mt-4 flex flex-wrap gap-2">
            {status !== 'published' && <button disabled={busyId === review.id} onClick={() => void moderate(review, 'published')} className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"><ShieldCheck className="mr-1 inline h-3.5 w-3.5" />Publish</button>}
            {status !== 'flagged' && <button disabled={busyId === review.id} onClick={() => void moderate(review, 'flagged')} className="rounded-lg border border-amber-200 px-3 py-2 text-xs font-semibold text-amber-700 disabled:opacity-50">Flag for review</button>}
            {review.status !== 'removed' && <button disabled={busyId === review.id} onClick={() => void moderate(review, 'removed')} className="rounded-lg border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700 disabled:opacity-50"><XCircle className="mr-1 inline h-3.5 w-3.5" />Remove</button>}
          </div>}
        </article>)}
      </div>}
    </div>
  );
}
