'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { FileText, RefreshCw, AlertCircle, ShieldCheck } from 'lucide-react';
import { apiClient, getApiErrorMessage } from '@/lib/api-client';

type AuditRecord = {
  id: string;
  actorId?: string;
  actorRole?: string;
  action: string;
  resourceType?: string;
  resourceId?: string;
  ipAddress?: string;
  createdAt?: string;
};

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadLogs = useCallback(async (showSpinner = false) => {
    if (showSpinner) setRefreshing(true);
    try {
      const response = await apiClient.get('/admin/audit-logs', { params: { page: 1, limit: 100 } });
      setLogs(Array.isArray(response.data?.data) ? response.data.data : []);
      setError('');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not load audit records.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadLogs();
    const interval = window.setInterval(() => void loadLogs(), 30000);
    return () => window.clearInterval(interval);
  }, [loadLogs]);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div><h1 className="text-2xl font-bold text-slate-900">System Audit Logs</h1><p className="mt-1 text-sm text-slate-500">Recorded administrator and system actions from the PETWO audit trail.</p></div>
        <button onClick={() => void loadLogs(true)} disabled={refreshing} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-60"><RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />Refresh</button>
      </div>

      {error && <div role="alert" className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{error}</div>}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {loading ? <div className="p-12 text-center text-sm text-slate-500">Loading audit records…</div> : logs.length === 0 ? <div className="p-12 text-center"><FileText className="mx-auto h-8 w-8 text-slate-300" /><p className="mt-3 font-semibold text-slate-700">No audit records found</p><p className="mt-1 text-sm text-slate-500">Recorded administrative actions will appear here.</p></div> : (
          <div className="overflow-x-auto"><table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-600"><tr><th className="px-5 py-3">Timestamp</th><th className="px-5 py-3">Actor</th><th className="px-5 py-3">Action</th><th className="px-5 py-3">Resource</th><th className="px-5 py-3">IP Address</th></tr></thead>
            <tbody className="divide-y divide-slate-100">{logs.map(log => <tr key={log.id} className="hover:bg-slate-50/70">
              <td className="whitespace-nowrap px-5 py-4 text-xs text-slate-500">{log.createdAt ? new Date(log.createdAt).toLocaleString('en-IN') : '—'}</td><td className="px-5 py-4"><div className="font-mono text-xs text-slate-800">{log.actorId || 'system'}</div><div className="mt-1 text-[11px] capitalize text-slate-400">{log.actorRole || '—'}</div></td><td className="px-5 py-4 font-mono text-xs font-semibold text-teal-700">{log.action}</td><td className="px-5 py-4 text-xs text-slate-600"><div>{log.resourceType || '—'}</div><div className="mt-1 font-mono text-[11px] text-slate-400">{log.resourceId || '—'}</div></td><td className="px-5 py-4 font-mono text-xs text-slate-500">{log.ipAddress || '—'}</td>
            </tr>)}</tbody>
          </table></div>
        )}
      </div>
      <p className="flex items-center gap-2 text-xs text-slate-400"><ShieldCheck className="h-4 w-4" />Read-only view. Audit entries are not editable from the admin portal.</p>
    </div>
  );
}
