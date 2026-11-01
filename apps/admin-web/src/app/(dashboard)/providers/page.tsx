'use client';

import React, { useState } from 'react';
import { ShieldCheck, Check, X, Building, Phone, Mail, FileText, AlertCircle } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function ProvidersAdminPage() {
  const [providers, setProviders] = useState([
    {
      id: 'provider-01',
      businessName: 'PetCare Diagnostics & Clinic',
      businessType: 'veterinary_clinic',
      contact: { phone: '+919876543210', email: 'support@petcarediag.in' },
      registrationNo: 'TG-VET-2023-4412',
      panNumber: 'ABCDE1234F',
      gstNumber: '36ABCDE1234F1Z5',
      verificationStatus: 'pending',
      createdAt: '2024-10-30T10:00:00.000Z',
    },
    {
      id: 'provider-02',
      businessName: 'The Pampered Paw Salon',
      businessType: 'grooming_salon',
      contact: { phone: '+918123456789', email: 'hello@pamperedpaw.com' },
      registrationNo: 'MCH-SHOP-8819',
      panNumber: 'FGHIJ5678K',
      gstNumber: '',
      verificationStatus: 'pending',
      createdAt: '2024-10-29T15:20:00.000Z',
    },
  ]);

  const [activeTab, setActiveTab] = useState<'pending' | 'approved'>('pending');

  function handleVerify(id: string, status: 'approved' | 'rejected') {
    setProviders(prev =>
      prev.map(p => (p.id === id ? { ...p, verificationStatus: status } : p))
    );
  }

  const filtered = providers.filter(p =>
    activeTab === 'pending'
      ? p.verificationStatus === 'pending'
      : p.verificationStatus === 'approved'
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Provider & Practice Verification</h1>
        <p className="text-sm text-slate-500 mt-1">
          Review business credentials, veterinary licensure and compliance before granting public listing
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-4">
        <button
          onClick={() => setActiveTab('pending')}
          className={`pb-3 text-sm font-semibold border-b-2 transition ${
            activeTab === 'pending'
              ? 'border-orange-600 text-orange-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Pending Review ({providers.filter(p => p.verificationStatus === 'pending').length})
        </button>
        <button
          onClick={() => setActiveTab('approved')}
          className={`pb-3 text-sm font-semibold border-b-2 transition ${
            activeTab === 'approved'
              ? 'border-orange-600 text-orange-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Verified Partners ({providers.filter(p => p.verificationStatus === 'approved').length})
        </button>
      </div>

      {/* List */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="bg-white p-12 text-center text-slate-400 rounded-xl border border-slate-200">
            No providers in this queue.
          </div>
        ) : (
          filtered.map(p => (
            <div key={p.id} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-bold text-slate-900">{p.businessName}</h3>
                  <span className="text-xs bg-slate-100 text-slate-700 font-medium px-2.5 py-0.5 rounded-full capitalize">
                    {p.businessType.replace(/_/g, ' ')}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5 text-slate-400" /> {p.contact.phone}
                  </span>
                  <span className="flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5 text-slate-400" /> {p.contact.email}
                  </span>
                  <span>Submitted: {formatDate(p.createdAt)}</span>
                </div>

                {/* Verification IDs */}
                <div className="flex flex-wrap gap-2 text-xs">
                  {p.registrationNo && (
                    <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded font-mono font-medium border border-blue-200">
                      Reg: {p.registrationNo}
                    </span>
                  )}
                  {p.panNumber && (
                    <span className="bg-slate-50 text-slate-700 px-2.5 py-1 rounded font-mono font-medium border border-slate-200">
                      PAN: {p.panNumber}
                    </span>
                  )}
                  {p.gstNumber && (
                    <span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded font-mono font-medium border border-emerald-200">
                      GSTIN: {p.gstNumber}
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              {p.verificationStatus === 'pending' && (
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleVerify(p.id, 'rejected')}
                    className="px-4 py-2 border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold rounded-lg transition flex items-center gap-1.5"
                  >
                    <X className="h-4 w-4" /> Reject Application
                  </button>
                  <button
                    onClick={() => handleVerify(p.id, 'approved')}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition flex items-center gap-1.5 shadow-sm"
                  >
                    <Check className="h-4 w-4" /> Approve & Verify
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
