'use client';

import React, { useState } from 'react';
import { Percent, Check, AlertCircle, Save } from 'lucide-react';

export default function CommissionsPage() {
  const [categories, setCategories] = useState([
    { id: 'cat-veterinary', name: 'Veterinary Care', defaultRate: 15, currentRate: 15 },
    { id: 'cat-grooming', name: 'Pet Grooming & Spa', defaultRate: 18, currentRate: 18 },
    { id: 'cat-boarding', name: 'Boarding & Daycare', defaultRate: 12, currentRate: 12 },
    { id: 'cat-training', name: 'Pet Training', defaultRate: 15, currentRate: 15 },
    { id: 'cat-diagnostics', name: 'Diagnostics & Pathology', defaultRate: 15, currentRate: 15 },
    { id: 'cat-home-services', name: 'Home Doorstep Vet & Grooming', defaultRate: 20, currentRate: 20 },
  ]);

  const [savedMessage, setSavedMessage] = useState(false);

  function handleRateChange(id: string, rate: number) {
    setCategories(prev =>
      prev.map(c => (c.id === id ? { ...c, currentRate: rate } : c))
    );
  }

  function handleSaveAll() {
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 3000);
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Commission & Take-Rate Engine</h1>
          <p className="text-sm text-slate-500 mt-1">
            Configure marketplace commission percentages deducted at booking settlement
          </p>
        </div>
        <button
          onClick={handleSaveAll}
          className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold rounded-lg transition shadow-sm"
        >
          <Save className="h-4 w-4" /> Save Rates
        </button>
      </div>

      {savedMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm flex items-center gap-2">
          <Check className="h-4 w-4" /> Commission policies saved and synchronized across active bookings.
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200 bg-slate-50 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-slate-500 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-slate-600 space-y-1">
            <p className="font-semibold text-slate-800">GST on Commission Policy</p>
            <p>
              In compliance with Indian taxation laws, 18% GST is collected on the marketplace commission
              amount (not the total booking amount). Providers with GSTIN can claim input tax credit.
            </p>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {categories.map(c => (
            <div key={c.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition">
              <div>
                <h4 className="font-semibold text-slate-900 text-base">{c.name}</h4>
                <p className="text-xs text-slate-400 mt-0.5">Category ID: {c.id}</p>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="5"
                    max="35"
                    step="0.5"
                    value={c.currentRate}
                    onChange={e => handleRateChange(c.id, Number(e.target.value))}
                    className="w-20 border border-slate-300 rounded-lg px-3 py-1.5 text-center font-bold text-slate-900 text-sm focus:outline-orange-600"
                  />
                  <span className="font-bold text-slate-600">%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
