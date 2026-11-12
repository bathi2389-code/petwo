'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle, ArrowRight, CalendarDays, CheckCircle2, Clock3,
  ClipboardList, Loader2, Scissors, ShieldCheck, Star,
} from 'lucide-react';
import { bookingApi, providerApi } from '@/lib/api-client';
import { formatCurrency, formatDate, formatTime } from '@/lib/utils';
import type { Booking, Provider } from '@petwo/shared';

function asDate(value: unknown): Date | null {
  if (!value) return null;
  const date = new Date(value as string);
  return Number.isNaN(date.getTime()) ? null : date;
}

export default function OverviewPage() {
  const [provider, setProvider] = useState<Provider | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError('');
      try {
        const [providerResponse, bookingResponse] = await Promise.all([
          providerApi.getProfile(),
          bookingApi.getBookings({ limit: 50 }),
        ]);
        if (!active) return;
        setProvider(providerResponse.data?.data ?? null);
        setBookings(bookingResponse.data?.data ?? []);
      } catch (cause: any) {
        if (active) setError(cause?.message || 'We could not load your live dashboard data. Please check your connection and try again.');
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, []);

  const todayBookings = useMemo(() => {
    const now = new Date();
    return bookings.filter(booking => {
      const date = asDate(booking.scheduledAt);
      return date && date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate();
    }).sort((a, b) => (asDate(a.scheduledAt)?.getTime() ?? 0) - (asDate(b.scheduledAt)?.getTime() ?? 0));
  }, [bookings]);

  const upcomingBookings = useMemo(() => bookings
    .filter(booking => {
      const date = asDate(booking.scheduledAt);
      return date && date.getTime() >= Date.now() && !['cancelled', 'completed', 'no_show'].includes(booking.status);
    })
    .sort((a, b) => (asDate(a.scheduledAt)?.getTime() ?? 0) - (asDate(b.scheduledAt)?.getTime() ?? 0))
    .slice(0, 6), [bookings]);

  const pendingCount = todayBookings.filter(booking => booking.status === 'pending_confirmation').length;
  const confirmedCount = todayBookings.filter(booking => ['confirmed', 'in_progress'].includes(booking.status)).length;

  return (
    <div className="mx-auto max-w-7xl space-y-7">
      {provider?.verificationStatus === 'pending' && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
          <div><h2 className="text-sm font-extrabold text-amber-950">Application under review</h2><p className="mt-1 text-sm leading-6 text-amber-900/80">Your provider application is awaiting PETWO verification. You can prepare your services and business information while it is reviewed.</p></div>
        </div>
      )}
      {provider?.verificationStatus === 'approved' && (
        <div className="flex flex-col gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3"><ShieldCheck className="h-5 w-5 text-emerald-700" /><div><p className="text-sm font-extrabold text-emerald-950">Verified PETWO partner</p><p className="mt-0.5 text-xs text-emerald-800">Your provider application has been approved.</p></div></div>
          <span className="w-fit rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">Approved</span>
        </div>
      )}
      {provider?.verificationStatus && !['approved', 'pending'].includes(provider.verificationStatus) && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">Provider verification status: <strong className="capitalize text-slate-900">{provider.verificationStatus.replace(/_/g, ' ')}</strong>. Contact PETWO support if you need help.</div>
      )}

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div><p className="text-xs font-extrabold uppercase tracking-[.18em] text-teal-700">Partner workspace</p><h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Good to see you{provider?.businessName ? `, ${provider.businessName}` : ''}.</h1><p className="mt-2 text-sm text-slate-500">Here is the latest information available for your business.</p></div>
        <Link href="/services" className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-800 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-teal-900"><Scissors className="h-4 w-4" /> Manage services</Link>
      </div>

      {error && <div role="alert" className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"><AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" /><div><p className="font-bold">Dashboard data unavailable</p><p className="mt-1">{error}</p><button onClick={() => window.location.reload()} className="mt-3 font-bold underline">Try again</button></div></div>}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Booking summary">
        {[
          { label: "Today's appointments", value: loading ? '—' : String(todayBookings.length), hint: 'Bookings scheduled for today', icon: CalendarDays, tone: 'bg-teal-50 text-teal-800' },
          { label: 'Confirmed today', value: loading ? '—' : String(confirmedCount), hint: 'Confirmed or in progress', icon: CheckCircle2, tone: 'bg-emerald-50 text-emerald-700' },
          { label: 'Awaiting confirmation', value: loading ? '—' : String(pendingCount), hint: 'Pending booking requests', icon: Clock3, tone: 'bg-amber-50 text-amber-700' },
          { label: 'Customer rating', value: typeof provider?.rating === 'number' ? provider.rating.toFixed(1) : 'Not rated', hint: typeof provider?.reviewCount === 'number' ? `${provider.reviewCount} published reviews` : 'No published review count available', icon: Star, tone: 'bg-violet-50 text-violet-700' },
        ].map(item => <article key={item.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><span className="text-sm font-semibold text-slate-500">{item.label}</span><span className={`flex h-10 w-10 items-center justify-center rounded-xl ${item.tone}`}><item.icon className="h-5 w-5" /></span></div><p className="mt-5 text-3xl font-black tracking-tight text-slate-950">{item.value}</p><p className="mt-1 text-xs text-slate-500">{item.hint}</p></article>)}
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6"><div><h2 className="font-extrabold text-slate-950">Upcoming appointments</h2><p className="mt-1 text-xs text-slate-500">Your next scheduled customer bookings</p></div><Link href="/bookings" className="inline-flex items-center gap-2 text-sm font-bold text-teal-800 hover:text-teal-950">View all bookings <ArrowRight className="h-4 w-4" /></Link></div>
        {loading ? <div className="flex items-center justify-center gap-2 p-12 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Loading live bookings…</div> : upcomingBookings.length === 0 ? <div className="px-6 py-14 text-center"><ClipboardList className="mx-auto h-9 w-9 text-slate-300" /><h3 className="mt-3 font-bold text-slate-900">No upcoming appointments</h3><p className="mt-1 text-sm text-slate-500">New bookings will appear here when customers book your services.</p></div> : <div className="divide-y divide-slate-100">{upcomingBookings.map(booking => <article key={booking.id} className="flex flex-col gap-3 px-5 py-4 transition hover:bg-slate-50/70 sm:flex-row sm:items-center sm:justify-between sm:px-6"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="font-bold text-slate-900">{booking.bookingNumber || booking.id}</p><span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold capitalize text-slate-600">{booking.status.replace(/_/g, ' ')}</span></div><p className="mt-1 text-xs text-slate-500">{formatDate(booking.scheduledAt)} · {formatTime(booking.scheduledAt)}</p></div><div className="flex items-center justify-between gap-4 sm:justify-end"><p className="text-sm font-extrabold text-slate-900">{formatCurrency(booking.pricing?.totalAmount || 0)}</p>{booking.status === 'pending_confirmation' && <button onClick={async () => { try { await bookingApi.confirmBooking(booking.id); window.location.reload(); } catch (cause: any) { window.alert(cause?.message || 'Could not confirm this booking.'); } }} className="rounded-lg bg-emerald-700 px-3 py-2 text-xs font-bold text-white transition hover:bg-emerald-800">Confirm</button>}</div></article>)}</div>}
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Link href="/bookings" className="group rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-md"><CalendarDays className="h-5 w-5 text-teal-800" /><h3 className="mt-4 font-extrabold text-slate-900">Manage bookings</h3><p className="mt-1 text-sm leading-6 text-slate-500">Review requests and keep appointment statuses up to date.</p><span className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-teal-800">Open bookings <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" /></span></Link>
        <Link href="/services" className="group rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-md"><Scissors className="h-5 w-5 text-teal-800" /><h3 className="mt-4 font-extrabold text-slate-900">Your services</h3><p className="mt-1 text-sm leading-6 text-slate-500">Maintain the services and prices shown to pet parents.</p><span className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-teal-800">Manage services <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" /></span></Link>
        <Link href="/reviews" className="group rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-md"><Star className="h-5 w-5 text-teal-800" /><h3 className="mt-4 font-extrabold text-slate-900">Customer feedback</h3><p className="mt-1 text-sm leading-6 text-slate-500">Read published reviews and respond to pet parents.</p><span className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-teal-800">View reviews <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" /></span></Link>
      </section>
    </div>
  );
}
