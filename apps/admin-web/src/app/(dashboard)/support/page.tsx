'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Headphones, RefreshCw, AlertCircle, Clock, CheckCircle, MessageSquare, ShieldCheck } from 'lucide-react';
import { apiClient, getApiErrorMessage } from '@/lib/api-client';
import { formatDate } from '@/lib/utils';

type TicketStatus = 'open' | 'in_progress' | 'waiting_user' | 'resolved' | 'closed';
type SupportTicket = {
  id: string;
  ticketNumber?: string;
  userId: string;
  userRole?: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: TicketStatus;
  subject: string;
  description: string;
  bookingId?: string;
  createdAt?: string;
  updatedAt?: string;
  messages?: Array<{ id: string; authorId: string; authorRole?: string; body: string; createdAt?: string }>;
};

const statuses: Array<'all' | TicketStatus> = ['all', 'open', 'in_progress', 'waiting_user', 'resolved', 'closed'];

const statusStyles: Record<TicketStatus, string> = {
  open: 'bg-rose-50 text-rose-700',
  in_progress: 'bg-amber-50 text-amber-700',
  waiting_user: 'bg-sky-50 text-sky-700',
  resolved: 'bg-emerald-50 text-emerald-700',
  closed: 'bg-slate-100 text-slate-600',
};

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [filter, setFilter] = useState<'all' | TicketStatus>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadTickets = useCallback(async (showSpinner = false) => {
    if (showSpinner) setRefreshing(true);
    try {
      const response = await apiClient.get('/support/tickets', {
        params: { page: 1, limit: 100, status: filter === 'all' ? undefined : filter },
      });
      setTickets(Array.isArray(response.data?.data) ? response.data.data : []);
      setError('');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not load support tickets. Check your admin session and backend connection.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter]);

  useEffect(() => {
    void loadTickets();
    const interval = window.setInterval(() => void loadTickets(), 30000);
    return () => window.clearInterval(interval);
  }, [loadTickets]);

  async function updateStatus(ticketId: string, status: TicketStatus) {
    setBusyId(ticketId);
    setError('');
    setNotice('');
    try {
      await apiClient.put(`/support/tickets/${ticketId}/status`, { status });
      setNotice('Support ticket status updated.');
      await loadTickets();
    } catch (err) {
      setError(getApiErrorMessage(err, 'The ticket status could not be updated.'));
    } finally {
      setBusyId('');
    }
  }

  const counts = statuses.slice(1).reduce((result, status) => {
    result[status] = tickets.filter(ticket => ticket.status === status).length;
    return result;
  }, {} as Record<TicketStatus, number>);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-teal-700">Customer care</p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Support & dispute resolution</h1>
          <p className="mt-2 text-sm text-slate-500">Live support tickets stored in Firebase. This list refreshes automatically every 30 seconds.</p>
        </div>
        <button type="button" onClick={() => void loadTickets(true)} disabled={refreshing} className="inline-flex w-fit items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60">
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </section>

      {!loading && !error && (
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5" aria-label="Ticket counts">
          {(['open', 'in_progress', 'waiting_user', 'resolved', 'closed'] as TicketStatus[]).map(status => (
            <article key={status} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold capitalize text-slate-500">{status.replace(/_/g, ' ')}</p>
              <p className="mt-2 text-2xl font-bold tabular-nums text-slate-950">{counts[status] ?? 0}</p>
            </article>
          ))}
        </section>
      )}

      <div className="flex flex-wrap gap-2" aria-label="Filter support tickets">
        {statuses.map(status => (
          <button key={status} type="button" onClick={() => setFilter(status)} aria-pressed={filter === status}
            className={`rounded-full px-4 py-2 text-xs font-semibold capitalize transition ${filter === status ? 'bg-teal-700 text-white shadow-sm' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}>
            {status === 'all' ? 'All tickets' : status.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {error && <div role="alert" className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{error}</div>}
      {notice && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{notice}</div>}

      <section className="space-y-3">
        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500">Loading live support tickets…</div>
        ) : tickets.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
            <Headphones className="mx-auto h-9 w-9 text-slate-300" />
            <p className="mt-3 font-semibold text-slate-800">No support tickets found</p>
            <p className="mt-1 text-sm text-slate-500">Real customer and provider support requests will appear here when submitted.</p>
          </div>
        ) : tickets.map(ticket => (
          <article key={ticket.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-semibold text-slate-950">{ticket.subject}</h2>
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ${statusStyles[ticket.status]}`}>{ticket.status.replace(/_/g, ' ')}</span>
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase ${ticket.priority === 'urgent' || ticket.priority === 'high' ? 'bg-rose-50 text-rose-700' : ticket.priority === 'medium' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>{ticket.priority}</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                  <span className="font-mono">{ticket.ticketNumber || ticket.id}</span>
                  <span className="capitalize">{ticket.category.replace(/_/g, ' ')}</span>
                  <span>From {ticket.userRole || 'user'} · {ticket.userId}</span>
                  <span>{ticket.createdAt ? formatDate(ticket.createdAt) : 'Date unavailable'}</span>
                  {ticket.bookingId && <span>Booking: {ticket.bookingId}</span>}
                </div>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">{ticket.description}</p>
                {ticket.messages && ticket.messages.length > 0 && (
                  <details className="mt-4 rounded-xl bg-slate-50 p-3">
                    <summary className="flex cursor-pointer list-none items-center gap-2 text-xs font-semibold text-slate-700"><MessageSquare className="h-4 w-4" /> Conversation ({ticket.messages.length} messages)</summary>
                    <div className="mt-3 space-y-3">
                      {ticket.messages.map(message => <div key={message.id} className="border-l-2 border-teal-200 pl-3">
                        <p className="text-[11px] font-semibold capitalize text-slate-500">{message.authorRole || 'user'} · {message.createdAt ? formatDate(message.createdAt) : 'Time unavailable'}</p>
                        <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{message.body}</p>
                      </div>)}
                    </div>
                  </details>
                )}
              </div>
              <div className="flex shrink-0 flex-col gap-2 sm:flex-row lg:w-52 lg:flex-col">
                <label htmlFor={`ticket-status-${ticket.id}`} className="text-xs font-semibold text-slate-600">Update status</label>
                <select id={`ticket-status-${ticket.id}`} value={ticket.status} disabled={busyId === ticket.id}
                  onChange={event => void updateStatus(ticket.id, event.target.value as TicketStatus)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 disabled:opacity-60">
                  {statuses.slice(1).map(status => <option key={status} value={status}>{status.replace(/_/g, ' ')}</option>)}
                </select>
                {busyId === ticket.id && <span className="text-xs text-slate-500">Saving status…</span>}
              </div>
            </div>
          </article>
        ))}
      </section>
      <p className="flex items-center gap-2 text-xs text-slate-400"><ShieldCheck className="h-4 w-4" />Ticket details and status changes use the authenticated support API.</p>
    </div>
  );
}
