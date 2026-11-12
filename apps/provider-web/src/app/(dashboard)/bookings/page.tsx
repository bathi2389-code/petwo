'use client';

import React, { useEffect, useState } from 'react';
import { CalendarDays, Clock3, RefreshCw, AlertCircle, CheckCircle2, XCircle, PlayCircle, Eye, X } from 'lucide-react';
import { bookingApi } from '@/lib/api-client';
import { formatCurrency, formatTime, formatDate } from '@/lib/utils';
import type { Booking } from '@petwo/shared';

const statusTabs = [
  { label: 'All bookings', value: 'all' },
  { label: 'Awaiting', value: 'pending_confirmation' },
  { label: 'Confirmed', value: 'confirmed' },
  { label: 'In progress', value: 'in_progress' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
];

const statusTone: Record<string, string> = {
  confirmed: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  pending_confirmation: 'bg-amber-50 text-amber-800 ring-amber-200',
  in_progress: 'bg-blue-50 text-blue-800 ring-blue-200',
  completed: 'bg-slate-100 text-slate-700 ring-slate-200',
  cancelled: 'bg-rose-50 text-rose-800 ring-rose-200',
  no_show: 'bg-rose-50 text-rose-800 ring-rose-200',
};

export default function BookingsPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  async function loadBookings(manual = false) {
    setLoading(!manual);
    setRefreshing(manual);
    setError('');
    try {
      const params: Record<string, string | number> = { limit: 50 };
      if (activeTab !== 'all') params.status = activeTab;
      const response = await bookingApi.getBookings(params);
      setBookings(Array.isArray(response.data?.data) ? response.data.data : []);
    } catch (problem: any) {
      setError(problem?.message || 'We could not load your appointments. Check your connection and try again.');
      setBookings([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => { void loadBookings(); }, [activeTab]);

  async function handleStatusUpdate(id: string, status: string) {
    setBusyId(id);
    setError('');
    try {
      await bookingApi.updateStatus(id, { status });
      if (selectedBooking?.id === id) setSelectedBooking(null);
      await loadBookings(true);
    } catch (problem: any) {
      setError(problem?.message || 'The appointment status could not be updated.');
    } finally {
      setBusyId('');
    }
  }

  const pendingCount = bookings.filter(item => item.status === 'pending_confirmation').length;
  const confirmedCount = bookings.filter(item => item.status === 'confirmed').length;

  return (
    <div className="mx-auto max-w-7xl space-y-7">
      <section className="flex flex-col justify-between gap-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7 lg:flex-row lg:items-end">
        <div className="max-w-2xl"><p className="text-xs font-extrabold uppercase tracking-[.18em] text-teal-700">Customer appointments</p><h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Bookings & appointments</h1><p className="mt-2 text-sm leading-6 text-slate-500">Review incoming requests, confirm visits and keep each appointment moving through its next step.</p></div>
        <button type="button" onClick={() => void loadBookings(true)} disabled={refreshing} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} /> Refresh bookings</button>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <article className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Bookings in this view</p><p className="mt-2 text-3xl font-black text-slate-950">{loading ? '—' : bookings.length}</p><p className="mt-1 text-xs text-slate-400">Live records returned by PETWO</p></article>
        <article className="rounded-2xl border border-amber-200 bg-amber-50/60 p-5"><p className="text-xs font-bold uppercase tracking-wide text-amber-800">Awaiting confirmation</p><p className="mt-2 text-3xl font-black text-amber-950">{loading ? '—' : pendingCount}</p><p className="mt-1 text-xs text-amber-800/70">Requests needing your attention</p></article>
        <article className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5"><p className="text-xs font-bold uppercase tracking-wide text-emerald-800">Confirmed in this view</p><p className="mt-2 text-3xl font-black text-emerald-950">{loading ? '—' : confirmedCount}</p><p className="mt-1 text-xs text-emerald-800/70">Ready for the next appointment step</p></article>
      </section>

      {error && <div role="alert" className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><p className="flex-1">{error}</p><button type="button" onClick={() => void loadBookings(true)} className="font-bold underline">Retry</button></div>}

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-4 sm:p-5"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><h2 className="font-extrabold text-slate-950">Appointment list</h2><p className="mt-1 text-xs text-slate-500">Filter by status to focus on the work that needs attention.</p></div><span className="text-xs font-semibold text-slate-400">{loading ? 'Loading records…' : `${bookings.length} records`}</span></div>
          <div className="mt-4 flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Filter bookings">{statusTabs.map(tab => <button key={tab.value} type="button" role="tab" aria-selected={activeTab === tab.value} onClick={() => setActiveTab(tab.value)} className={`shrink-0 rounded-xl px-3.5 py-2.5 text-xs font-bold transition ${activeTab === tab.value ? 'bg-teal-800 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{tab.label}</button>)}</div>
        </div>
        {loading ? <div className="space-y-3 p-5">{[0,1,2,3].map(item => <div key={item} className="h-16 animate-pulse rounded-xl bg-slate-100" />)}</div> : bookings.length === 0 ? <div className="px-6 py-16 text-center"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 text-teal-800"><CalendarDays className="h-7 w-7" /></div><h3 className="mt-4 font-extrabold text-slate-950">No appointments in this view</h3><p className="mt-2 text-sm text-slate-500">When customers request appointments, their records will appear here.</p></div> : (
          <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-slate-50 text-[10px] font-extrabold uppercase tracking-wider text-slate-500"><tr><th className="px-5 py-4">Booking reference</th><th className="px-5 py-4">Appointment</th><th className="px-5 py-4">Service type</th><th className="px-5 py-4">Amount</th><th className="px-5 py-4">Status</th><th className="px-5 py-4 text-right">Actions</th></tr></thead><tbody className="divide-y divide-slate-100">{bookings.map(booking => <tr key={booking.id} className="transition hover:bg-slate-50/80"><td className="px-5 py-4"><p className="font-extrabold text-slate-900">{booking.bookingNumber || 'Booking'}</p><p className="mt-1 font-mono text-[10px] text-slate-400">{booking.id.slice(0, 12)}</p></td><td className="px-5 py-4"><p className="font-semibold text-slate-800">{formatDate(booking.scheduledAt)}</p><p className="mt-1 inline-flex items-center gap-1 text-xs text-slate-500"><Clock3 className="h-3 w-3" />{formatTime(booking.scheduledAt)}</p></td><td className="px-5 py-4 capitalize text-slate-600">{booking.bookingType.replace(/_/g, ' ')}</td><td className="px-5 py-4"><p className="font-bold text-slate-900">{formatCurrency(booking.pricing?.totalAmount || 0)}</p><p className="mt-1 text-[10px] text-slate-400">Total amount</p></td><td className="px-5 py-4"><span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-extrabold capitalize ring-1 ring-inset ${statusTone[booking.status] || statusTone.cancelled}`}>{booking.status.replace(/_/g, ' ')}</span></td><td className="px-5 py-4"><div className="flex items-center justify-end gap-2">{booking.status === 'pending_confirmation' && <button type="button" disabled={busyId === booking.id} onClick={() => void handleStatusUpdate(booking.id, 'confirmed')} className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50"><CheckCircle2 className="h-3.5 w-3.5" /> Confirm</button>}{booking.status === 'confirmed' && <button type="button" disabled={busyId === booking.id} onClick={() => void handleStatusUpdate(booking.id, 'in_progress')} className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50"><PlayCircle className="h-3.5 w-3.5" /> Start</button>}{booking.status === 'in_progress' && <button type="button" disabled={busyId === booking.id} onClick={() => void handleStatusUpdate(booking.id, 'completed')} className="inline-flex items-center gap-1 rounded-lg bg-slate-800 px-3 py-2 text-xs font-bold text-white hover:bg-slate-900 disabled:opacity-50"><CheckCircle2 className="h-3.5 w-3.5" /> Complete</button>}<button type="button" onClick={() => setSelectedBooking(booking)} aria-label="View booking details" className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-100"><Eye className="h-4 w-4" /></button></div></td></tr>)}</tbody></table></div>
        )}
      </section>

      {selectedBooking && <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/45 backdrop-blur-sm" onMouseDown={event => { if (event.target === event.currentTarget) setSelectedBooking(null); }}><section role="dialog" aria-modal="true" aria-labelledby="booking-detail-title" className="h-full w-full max-w-lg overflow-y-auto bg-white p-5 shadow-2xl sm:p-7"><div className="flex items-start justify-between border-b border-slate-100 pb-5"><div><p className="text-xs font-extrabold uppercase tracking-wider text-teal-700">Appointment details</p><h2 id="booking-detail-title" className="mt-1 text-xl font-black text-slate-950">{selectedBooking.bookingNumber || 'Booking details'}</h2></div><button type="button" onClick={() => setSelectedBooking(null)} aria-label="Close details" className="rounded-xl p-2 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button></div><div className="mt-6 space-y-5"><div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold text-slate-500">Appointment time</p><p className="mt-1 font-extrabold text-slate-950">{formatDate(selectedBooking.scheduledAt)} · {formatTime(selectedBooking.scheduledAt)}</p><span className={`mt-3 inline-flex rounded-full px-2.5 py-1 text-[10px] font-extrabold capitalize ring-1 ring-inset ${statusTone[selectedBooking.status] || statusTone.cancelled}`}>{selectedBooking.status.replace(/_/g, ' ')}</span></div><div><p className="text-xs font-bold uppercase tracking-wide text-slate-400">Customer reference</p><p className="mt-1 break-all text-sm font-semibold text-slate-800">{selectedBooking.customerId}</p></div>{selectedBooking.notes && <div><p className="text-xs font-bold uppercase tracking-wide text-slate-400">Customer notes</p><p className="mt-2 rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">{selectedBooking.notes}</p></div>}<div className="rounded-2xl border border-slate-200 p-4"><h3 className="font-extrabold text-slate-900">Booking amount</h3><div className="mt-3 flex justify-between text-sm text-slate-600"><span>Service amount</span><span>{formatCurrency(selectedBooking.pricing?.serviceAmount || 0)}</span></div><div className="mt-2 flex justify-between text-sm text-slate-600"><span>Tax</span><span>{formatCurrency(selectedBooking.pricing?.taxAmount || 0)}</span></div><div className="mt-3 flex justify-between border-t border-slate-100 pt-3 text-sm font-extrabold text-slate-950"><span>Customer total</span><span>{formatCurrency(selectedBooking.pricing?.totalAmount || 0)}</span></div><p className="mt-3 text-xs leading-5 text-slate-400">Online payment and automated payout are not enabled for the current MVP.</p></div></div></section></div>}
    </div>
  );
}
