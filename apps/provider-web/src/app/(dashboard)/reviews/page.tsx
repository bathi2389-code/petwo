'use client';

import React, { useState } from 'react';
import { Star, MessageSquare, CheckCircle2, CornerDownRight } from 'lucide-react';
import { reviewApi } from '@/lib/api-client';
import { formatDate } from '@/lib/utils';

export default function ReviewsPage() {
  const [reviews, setReviews] = useState([
    {
      id: 'rev-01',
      customerName: 'Ananya Sharma',
      petName: 'Rocky (Golden Retriever)',
      rating: 5,
      date: '2024-10-28T14:30:00.000Z',
      body: 'Dr. Srinivas and the team at TailBlazers Banjara Hills were phenomenal with Rocky! He had severe ear inflammation and they handled him with utmost care and gentleness. Highly recommended for all pet parents in Hyderabad!',
      verifiedBooking: true,
      providerResponse: 'Thank you so much Ananya! Rocky was such a brave boy during the exam. Please do give him the ear drops as prescribed and feel free to reach out on WhatsApp if you need any follow-up guidance.',
    },
    {
      id: 'rev-02',
      customerName: 'Vikram Reddy',
      petName: 'Milo (Persian Cat)',
      rating: 4,
      date: '2024-10-24T11:00:00.000Z',
      body: 'Great grooming session. Milo looks super fluffy and clean. Waiting time was about 15 minutes past the slot, but the groomers did a thorough job.',
      verifiedBooking: true,
      providerResponse: null,
    },
  ]);

  const [replyText, setReplyText] = useState<{ [key: string]: string }>({});
  const [submitting, setSubmitting] = useState<string | null>(null);

  async function handleSendReply(reviewId: string) {
    const text = replyText[reviewId];
    if (!text || text.trim().length === 0) return;

    setSubmitting(reviewId);
    try {
      await reviewApi.respondToReview(reviewId, text);
      setReviews(prev =>
        prev.map(r => (r.id === reviewId ? { ...r, providerResponse: text } : r))
      );
      setReplyText(prev => ({ ...prev, [reviewId]: '' }));
    } catch (err) {
      // Optimistic update for UI demo
      setReviews(prev =>
        prev.map(r => (r.id === reviewId ? { ...r, providerResponse: text } : r))
      );
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
          <div className="text-4xl font-extrabold text-gray-900">4.9</div>
          <div className="flex items-center gap-1 mt-1 justify-center md:justify-start">
            {[1, 2, 3, 4, 5].map(i => (
              <Star key={i} className="h-4 w-4 text-amber-400 fill-amber-400" />
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-1">Based on 142 verified bookings</p>
        </div>

        <div className="flex-1 w-full space-y-1.5 text-xs text-gray-600">
          <div className="flex items-center gap-2">
            <span className="w-6">5 ★</span>
            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="bg-amber-400 h-full w-[88%]" />
            </div>
            <span className="w-8 text-right">88%</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-6">4 ★</span>
            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="bg-amber-400 h-full w-[10%]" />
            </div>
            <span className="w-8 text-right">10%</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-6">3 ★</span>
            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="bg-amber-400 h-full w-[2%]" />
            </div>
            <span className="w-8 text-right">2%</span>
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.map(rev => (
          <div key={rev.id} className="bg-white rounded-xl border shadow-sm p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-gray-900 text-sm">{rev.customerName}</h4>
                  <span className="text-xs text-gray-400">•</span>
                  <span className="text-xs font-medium text-gray-600">{rev.petName}</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex items-center">
                    {[...Array(rev.rating)].map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                    ))}
                  </div>
                  <span className="text-xs text-gray-400">{formatDate(rev.date)}</span>
                  {rev.verifiedBooking && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-medium">
                      <CheckCircle2 className="h-3 w-3" />
                      Verified Visit
                    </span>
                  )}
                </div>
              </div>
            </div>

            <p className="text-sm text-gray-700 leading-relaxed">{rev.body}</p>

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
