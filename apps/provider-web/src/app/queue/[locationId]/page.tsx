'use client';

import React, { useState, useEffect } from 'react';
import { Clock, ShieldAlert, Volume2, Sparkles, Building2, Stethoscope } from 'lucide-react';
import { apiClient } from '@/lib/api-client';

interface QueuePayload {
  locationId: string;
  nowServing: {
    tokenNumber: string;
    room: string;
    doctorName: string;
    petName: string;
    serviceName: string;
  };
  upNext: Array<{
    tokenNumber: string;
    scheduledTime: string;
    estimatedWaitMins: number;
    status: string;
  }>;
  stats: {
    totalToday: number;
    completedToday: number;
    inWaitingRoom: number;
  };
  announcement: string;
}

export default function ReceptionQueueTVDisplay({ params }: { params: { locationId: string } }) {
  const [data, setData] = useState<QueuePayload | null>(null);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Live Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Poll live queue state
  useEffect(() => {
    async function fetchQueue() {
      try {
        const res = await apiClient.get(`/queue/${encodeURIComponent(params.locationId)}`);
        if (res.data?.data) {
          setData(res.data.data);
          setLoadError(null);
        } else {
          setLoadError('Queue data is not available.');
        }
      } catch {
        setLoadError('Could not load the live queue. Retrying shortly.');
      }
    }

    fetchQueue();
    const pollInterval = setInterval(fetchQueue, 5000);
    return () => clearInterval(pollInterval);
  }, [params.locationId]);

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans flex flex-col justify-between overflow-hidden select-none p-6 lg:p-10">
      {/* Top Header Bar */}
      <header className="flex items-center justify-between border-b border-slate-800 pb-6">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-orange-600 flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-orange-600/30">
            P
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight">PETWO Healthcare Network</h1>
              <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-bold rounded-full border border-emerald-500/20">
                {loadError ? 'CONNECTION ISSUE' : 'LIVE QUEUE'}
              </span>
            </div>
            <p className="text-slate-400 text-sm mt-0.5 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-orange-500" />
              Location {params.locationId}
            </p>
          </div>
        </div>

        <div className="text-right">
          <div className="font-mono text-3xl lg:text-4xl font-extrabold tracking-wider text-orange-400">
            {currentTime}
          </div>
          <div className="text-xs text-slate-400 uppercase tracking-widest mt-1 font-semibold">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}
          </div>
        </div>
      </header>

      {loadError && <p role="status" className="my-3 rounded-xl border border-amber-700/50 bg-amber-950/40 px-4 py-3 text-sm text-amber-200">{loadError}</p>}

      {/* Main Split Screen */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 my-auto py-6">
        {/* Left Column: NOW SERVING (Big Prominent Display) */}
        <div className="lg:col-span-7 bg-gradient-to-br from-slate-900 to-slate-900/80 border border-slate-800 rounded-3xl p-8 lg:p-12 shadow-2xl relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-96 h-96 bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />

          <div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-500/10 text-orange-400 font-bold text-sm uppercase tracking-widest border border-orange-500/20 mb-6">
              <Sparkles className="h-4 w-4 animate-pulse" />
              Now Serving
            </div>

            <div className="space-y-4">
              <div className="text-7xl lg:text-9xl font-black font-mono tracking-tight text-white drop-shadow-md">
                {data?.nowServing.tokenNumber || '---'}
              </div>

              <div className="space-y-2 pt-2">
                <div className="text-2xl lg:text-3xl font-bold text-orange-300">
                {data?.nowServing.room || 'No active appointment'}
                </div>
                <div className="text-lg lg:text-xl text-slate-200 font-medium flex items-center gap-2">
                  <Stethoscope className="h-5 w-5 text-orange-400" />
                  {data?.nowServing.doctorName || '—'}
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-6 mt-8 flex items-center justify-between">
            <div>
              <span className="text-xs uppercase tracking-wider text-slate-400 font-bold">Patient Name</span>
              <div className="text-lg font-bold text-white mt-0.5">{data?.nowServing.petName || '—'}</div>
            </div>
            <div className="text-right">
              <span className="text-xs uppercase tracking-wider text-slate-400 font-bold">Procedure</span>
              <div className="text-sm font-semibold text-slate-300 mt-0.5">{data?.nowServing.serviceName}</div>
            </div>
          </div>
        </div>

        {/* Right Column: UP NEXT QUEUE */}
        <div className="lg:col-span-5 bg-slate-900/60 border border-slate-800 rounded-3xl p-6 lg:p-8 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
              <h2 className="text-xl font-bold tracking-tight text-slate-200">Up Next In Queue</h2>
              <span className="text-xs text-slate-400 font-medium">Est. Wait</span>
            </div>

            <div className="space-y-3">
              {data?.upNext.map((item, idx) => (
                <div
                  key={item.tokenNumber}
                  className="bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 rounded-2xl p-4 flex items-center justify-between transition"
                >
                  <div className="flex items-center gap-4">
                    <span className="h-8 w-8 rounded-full bg-slate-700 text-slate-300 font-mono font-bold text-xs flex items-center justify-center">
                      #{idx + 1}
                    </span>
                    <div>
                      <div className="font-mono text-xl font-black text-white">{item.tokenNumber}</div>
                      <div className="text-xs text-slate-400">Scheduled: {item.scheduledTime}</div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm font-bold text-emerald-400">~{item.estimatedWaitMins} mins</div>
                    <div className="text-[10px] uppercase text-slate-500 font-semibold">Estimated</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-3 border-t border-slate-800 pt-6 mt-6 text-center">
            <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400 block">Today's Visits</span>
              <span className="text-xl font-bold text-white mt-1 block">{data?.stats.totalToday || 0}</span>
            </div>
            <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400 block">Completed</span>
              <span className="text-xl font-bold text-emerald-400 mt-1 block">{data?.stats.completedToday || 0}</span>
            </div>
            <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400 block">Waiting</span>
              <span className="text-xl font-bold text-orange-400 mt-1 block">{data?.stats.inWaitingRoom || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Live Ticker */}
      <footer className="bg-orange-950/60 border border-orange-900/60 rounded-2xl px-6 py-3 flex items-center gap-4 overflow-hidden shadow-lg">
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-orange-400 flex-shrink-0">
          <ShieldAlert className="h-4 w-4" />
          ANNOUNCEMENT:
        </div>
        <div className="text-sm font-medium text-orange-200 whitespace-nowrap overflow-hidden text-ellipsis">
          {data?.announcement || 'Live queue updates will appear here.'}
        </div>
      </footer>
    </div>
  );
}
