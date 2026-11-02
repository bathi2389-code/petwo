'use client';

import React from 'react';
import { FileText, ShieldAlert, CheckCircle2, User, Key, Database } from 'lucide-react';

export default function AdminAuditLogsPage() {
  const logs = [
    {
      id: 'AUD-88210',
      timestamp: '02 Nov 2026, 13:26:40',
      actor: 'system (scheduler)',
      action: 'SETTLEMENT_BATCH_EXECUTE',
      target: '12 approved providers',
      ip: '10.0.4.12',
      status: 'success',
    },
    {
      id: 'AUD-88209',
      timestamp: '02 Nov 2026, 12:15:10',
      actor: 'admin@petco.in',
      action: 'PROVIDER_APPROVE_KYC',
      target: 'Dr. Rao Pet Hospital (Banjara Hills)',
      ip: '49.205.112.44',
      status: 'success',
    },
    {
      id: 'AUD-88208',
      timestamp: '02 Nov 2026, 11:04:22',
      actor: 'system (security-engine)',
      action: 'OTP_RATE_LIMIT_BLOCKED',
      target: '+919999999999',
      ip: '103.21.144.90',
      status: 'blocked',
    },
    {
      id: 'AUD-88207',
      timestamp: '02 Nov 2026, 09:30:15',
      actor: 'admin@petco.in',
      action: 'COMMISSION_UPDATE',
      target: 'Category: Veterinary Care (15% -> 15%)',
      ip: '49.205.112.44',
      status: 'success',
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Immutable System Audit Logs</h1>
        <p className="text-sm text-slate-500 mt-1">DPDPA 2023 & Financial compliance audit trail of all sensitive admin actions</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 text-xs uppercase">
            <tr>
              <th className="px-6 py-3.5">Log ID</th>
              <th className="px-6 py-3.5">Timestamp</th>
              <th className="px-6 py-3.5">Actor</th>
              <th className="px-6 py-3.5">Action Code</th>
              <th className="px-6 py-3.5">Target / Resource</th>
              <th className="px-6 py-3.5">IP Address</th>
              <th className="px-6 py-3.5">Outcome</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-mono text-xs">
            {logs.map((l) => (
              <tr key={l.id} className="hover:bg-slate-50/70">
                <td className="px-6 py-4 font-semibold text-slate-900">{l.id}</td>
                <td className="px-6 py-4 text-slate-500">{l.timestamp}</td>
                <td className="px-6 py-4 font-sans font-medium text-slate-900">{l.actor}</td>
                <td className="px-6 py-4 text-orange-600 font-semibold">{l.action}</td>
                <td className="px-6 py-4 font-sans text-slate-700">{l.target}</td>
                <td className="px-6 py-4 text-slate-500">{l.ip}</td>
                <td className="px-6 py-4">
                  {l.status === 'success' ? (
                    <span className="inline-flex items-center gap-1 font-sans px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                      Success
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 font-sans px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">
                      Blocked
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
