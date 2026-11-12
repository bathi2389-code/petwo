'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CornerDownRight, Loader2, MessageSquare, Send, Star } from 'lucide-react';
import { apiClient, providerApi, reviewApi } from '@/lib/api-client';
import { formatDate } from '@/lib/utils';

type ReviewRecord = {
  id: string;
  customerId?: string;
  rating: number;
  title?: string;
  body?: string;
  createdAt?: string;
  isVerified?: boolean;
  providerResponse?: string;
};

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<ReviewRecord[]>([]);
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true); setError('');
      try {
        const profile = await providerApi.getProfile();
        const providerId = profile.data?.data?.id || profile.data?.data?.userId;
        if (!providerId) throw new Error('Your provider profile could not be identified.');
        const response = await apiClient.get('/reviews', { params: { providerId, page: 1, limit: 50 } });
        if (active) setReviews(response.data?.data ?? []);
      } catch (cause: any) {
        if (active) setError(cause?.message || 'Could not load published reviews.');
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, []);

  const average = useMemo(() => reviews.length ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : null, [reviews]);
  const counts = useMemo(() => [5, 4, 3, 2, 1].map(rating => ({ rating, count: reviews.filter(review => review.rating === rating).length })), [reviews]);

  async function sendReply(reviewId: string) {
    const response = replyText[reviewId]?.trim();
    if (!response) return;
    setSubmitting(reviewId); setError(''); setSuccess('');
    try {
      await reviewApi.respondToReview(reviewId, response);
      setReviews(current => current.map(review => review.id === reviewId ? { ...review, providerResponse: response } : review));
      setReplyText(current => ({ ...current, [reviewId]: '' }));
      setSuccess('Your response was saved.');
    } catch (cause: any) {
      setError(cause?.message || 'Your response could not be saved. Please try again.');
    } finally {
      setSubmitting(null);
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-7">
      <div><p className="text-xs font-extrabold uppercase tracking-[.18em] text-teal-700">Customer voice</p><h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Reviews & ratings</h1><p className="mt-2 text-sm text-slate-500">Published customer feedback for your provider profile.</p></div>
      {error && <div role="alert" className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"><AlertTriangle className="h-5 w-5 shrink-0" />{error}</div>}
      {success && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">{success}</div>}
      <section className="grid gap-5 rounded-2xl border border-slate-200 bg-white p-6 md:grid-cols-[220px_1fr]">
        <div className="md:border-r md:border-slate-100 md:pr-6"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Loaded published reviews</p><p className="mt-3 text-4xl font-black text-slate-950">{loading ? '—' : reviews.length}</p><div className="mt-2 flex items-center gap-2">{average === null ? <span className="text-sm text-slate-500">No published ratings yet</span> : <><span className="text-2xl font-extrabold text-slate-900">{average.toFixed(1)}</span><span className="flex text-amber-400">{[1,2,3,4,5].map(i => <Star key={i} className={`h-4 w-4 ${average >= i - 0.5 ? 'fill-current' : ''}`} />)}</span></>}</div><p className="mt-2 text-xs leading-5 text-slate-400">Average is calculated from the reviews loaded below, not a lifetime aggregate.</p></div>
        <div className="space-y-3">{counts.map(({rating,count}) => <div key={rating} className="flex items-center gap-3 text-xs"><span className="w-8 font-bold text-slate-600">{rating} ★</span><div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-amber-400" style={{width: reviews.length ? `${count / reviews.length * 100}%` : '0%'}} /></div><span className="w-8 text-right text-slate-500">{count}</span></div>)}</div>
      </section>
      <section className="space-y-4">
        {loading ? <div className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white p-12 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Loading reviews…</div> : reviews.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center"><MessageSquare className="mx-auto h-9 w-9 text-slate-300" /><h2 className="mt-3 font-extrabold text-slate-900">No published reviews yet</h2><p className="mt-1 text-sm text-slate-500">Customer reviews will appear here after they are published by PETWO.</p></div> : reviews.map(review => <article key={review.id} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start"><div><p className="font-extrabold text-slate-900">{review.title || 'Customer review'}</p><p className="mt-1 text-xs text-slate-500">{review.customerId ? `Pet parent · ${review.customerId.slice(0, 8)}` : 'PETWO pet parent'}{review.createdAt ? ` · ${formatDate(review.createdAt)}` : ''}</p></div><div className="flex items-center gap-2"><span className="flex text-amber-400">{[1,2,3,4,5].map(i => <Star key={i} className={`h-4 w-4 ${review.rating >= i ? 'fill-current' : ''}`} />)}</span>{review.isVerified && <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-800">Verified booking</span>}</div></div>
          {review.body && <p className="text-sm leading-7 text-slate-700">{review.body}</p>}
          {review.providerResponse ? <div className="rounded-xl border-l-2 border-teal-700 bg-slate-50 p-4"><p className="flex items-center gap-2 text-xs font-extrabold text-slate-800"><CornerDownRight className="h-4 w-4 text-teal-700" /> Your response</p><p className="mt-2 text-sm leading-6 text-slate-600">{review.providerResponse}</p></div> : <div className="flex flex-col gap-2 sm:flex-row"><input aria-label="Write a public response" maxLength={1000} value={replyText[review.id] || ''} onChange={event => setReplyText(current => ({...current,[review.id]:event.target.value}))} placeholder="Write a helpful, professional reply…" className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" /><button onClick={() => sendReply(review.id)} disabled={!replyText[review.id]?.trim() || submitting === review.id} className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-800 px-4 py-3 text-sm font-bold text-white disabled:opacity-50">{submitting === review.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Send response</button></div>}
        </article>)}
      </section>
    </div>
  );
}
