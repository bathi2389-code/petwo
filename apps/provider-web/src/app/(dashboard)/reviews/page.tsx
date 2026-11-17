'use client';

import React, { useState } from 'react';
import { Star, CheckCircle2, CornerDownRight } from 'lucide-react';
import { reviewApi } from '@/lib/api-client';
import { formatDate } from '@/lib/utils';

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [replyText, setReplyText] = useState<{ [key: string]: string }>({});
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [insights, setInsights] = useState<any>(null);

  async function loadReviews() {
    setLoading(true);
    setError('');
    try {
      const [response, insightResponse] = await Promise.all([reviewApi.getReviews(), reviewApi.getInsights().catch(() => null)]);
      setReviews(response.data?.data?.reviews ?? []);
      setInsights(insightResponse?.data?.data ?? null);
    } catch (err: any) {
      setError(err?.message || 'Could not load published reviews.');
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => { void loadReviews(); }, []);

  const reviewCount = reviews.length;
  const average = reviewCount
    ? reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / reviewCount
    : 0;

  async function handleSendReply(reviewId: string) {
    const text = replyText[reviewId]?.trim();
    if (!text) return;
    setSubmitting(reviewId);
    setError('');
    try {
      await reviewApi.respondToReview(reviewId, text);
      setReviews(prev => prev.map(r => r.id === reviewId
        ? { ...r, providerResponse: text, providerRespondedAt: new Date().toISOString() }
        : r));
      setReplyText(prev => ({ ...prev, [reviewId]: '' }));
    } catch (err: any) {
      setError(err?.message || 'Your response could not be saved. Please try again.');
    } finally {
      setSubmitting(null);
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reviews & Ratings</h1>
        <p className="text-sm text-gray-500 mt-1">
          Ground-truth feedback from customers whose appointments have been completed
        </p>
      </div>

      {/* Ratings Aggregate Banner */}
      <div className="bg-white rounded-xl border shadow-sm p-6 flex flex-col md:flex-row items-center gap-8">
        <div className="text-center md:text-left md:border-r md:pr-8">
          <div className="text-4xl font-extrabold text-gray-900">{reviewCount ? average.toFixed(1) : "—"}</div>
          <div className="flex items-center gap-1 mt-1 justify-center md:justify-start">
            {[1, 2, 3, 4, 5].map(i => (
              <Star key={i} className="h-4 w-4 text-amber-400 fill-amber-400" />
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-1">{reviewCount} published customer reviews</p>
        </div>

        <div className="flex-1 w-full space-y-1.5 text-xs text-gray-600">
          <div className="flex items-center gap-2">
            <span className="w-6">5 ★</span>
            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="bg-amber-400 h-full" style={{ width: `${reviewCount ? reviews.filter(r => r.rating === 5).length / reviewCount * 100 : 0}%` }} />
            </div>
            <span className="w-8 text-right">{reviewCount ? Math.round(reviews.filter(r => r.rating === 5).length / reviewCount * 100) : 0}%</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-6">4 ★</span>
            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="bg-amber-400 h-full" style={{ width: `${reviewCount ? reviews.filter(r => r.rating === 4).length / reviewCount * 100 : 0}%` }} />
            </div>
            <span className="w-8 text-right">{reviewCount ? Math.round(reviews.filter(r => r.rating === 4).length / reviewCount * 100) : 0}%</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-6">3 ★</span>
            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="bg-amber-400 h-full" style={{ width: `${reviewCount ? reviews.filter(r => r.rating === 3).length / reviewCount * 100 : 0}%` }} />
            </div>
            <span className="w-8 text-right">{reviewCount ? Math.round(reviews.filter(r => r.rating === 3).length / reviewCount * 100) : 0}%</span>
          </div>
        </div>
      </div>

      {/* Reviews List */}
      {error && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
      <div className="space-y-4">
        {loading ? <p className="rounded-xl border bg-white p-8 text-center text-sm text-gray-500">Loading published reviews…</p> : reviews.length === 0 ? <p className="rounded-xl border bg-white p-8 text-center text-sm text-gray-500">No published customer reviews yet. Reviews appear here after completed bookings and admin publication.</p> : reviews.map(rev => (
          <div key={rev.id} className="bg-white rounded-xl border shadow-sm p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-gray-900 text-sm">Verified PETWO customer</h4>
                  <span className="text-xs text-gray-400">•</span>
                  <span className="text-xs font-medium text-gray-600">Booking {rev.bookingId}</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex items-center">
                    {[...Array(rev.rating)].map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                    ))}
                  </div>
                  <span className="text-xs text-gray-400">{formatDate(rev.createdAt)}</span>
                  {rev.isVerified && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-medium">
                      <CheckCircle2 className="h-3 w-3" />
                      Verified Visit
                    </span>
                  )}
                </div>
              </div>
            </div>

            <p className="text-sm text-gray-700 leading-relaxed">{rev.body || rev.title || "Customer left a star rating without written feedback."}</p>

            {/* Provider Public Response */}
            {rev.providerResponse ? (
              <div className="bg-gray-50 border-l-2 border-primary rounded-r-lg p-3 text-xs text-gray-700 space-y-1">
                <div className="font-semibold text-gray-900 flex items-center gap-1.5">
                  <CornerDownRight className="h-3.5 w-3.5 text-primary" />
                  Your Response
                </div>
                <p>{rev.providerResponse}</p>
              </div>
            ) : (
              <div className="pt-2 border-t">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Write a public response to this review..."
                    value={replyText[rev.id] || ''}
                    onChange={e => setReplyText({ ...replyText, [rev.id]: e.target.value })}
                    className="flex-1 border rounded-lg px-3 py-1.5 text-xs focus:outline-primary"
                  />
                  <button
                    onClick={() => handleSendReply(rev.id)}
                    disabled={submitting === rev.id}
                    className="px-3 py-1.5 bg-gray-900 hover:bg-black text-white text-xs font-medium rounded-lg transition"
                  >
                    Reply
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
