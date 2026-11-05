'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, MapPin, Search, ShieldCheck, Star, Stethoscope } from 'lucide-react';
import { apiClient } from '@/lib/api-client';

type Provider = {
  id: string; businessName: string; businessType?: string; description?: string;
  tagline?: string; address?: { line1?: string; city?: string; state?: string };
  rating?: number; reviewCount?: number; verificationStatus?: string; distanceKm?: number;
};

export default function CareDirectoryPage() {
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState('recommended');
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [coordinates, setCoordinates] = useState<{lat:number;lng:number}|null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationMessage, setLocationMessage] = useState('');

  const requestLocation = () => {
    if (!('geolocation' in navigator)) { setLocationMessage('Location is not supported by this browser. You can still search by clinic or city.'); return; }
    setLocationLoading(true); setLocationMessage('Waiting for browser location permission…');
    navigator.geolocation.getCurrentPosition(
      position => { setCoordinates({ lat: position.coords.latitude, lng: position.coords.longitude }); setLocationMessage('Your location is being used to sort nearby clinics.'); setLocationLoading(false); },
      err => { const message = err.code === 1 ? 'Location permission was denied. Allow location for localhost in your browser settings, then try again.' : err.code === 2 ? 'Your location could not be determined. Check device location services and try again.' : 'Location request timed out. Please try again.'; setLocationMessage(message); setLocationLoading(false); },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 },
    );
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('sortBy') === 'highest_rated') setSortBy('highest_rated');
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true); setError('');
    apiClient.get('/providers/search', { params: { query: query.trim() || undefined, sortBy, ...(coordinates ? { lat: coordinates.lat, lng: coordinates.lng } : {}), page: 1, limit: 30 } })
      .then(({ data }) => { if (active) setProviders(data?.data ?? []); })
      .catch((err) => { if (active) setError(err?.message || 'Could not load clinics. Check that the PETWO API is running.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [query, sortBy, coordinates]);

  return <main className="min-h-screen bg-[#f6faf8] text-slate-900">
    <header className="border-b border-slate-100 bg-white"><div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
      <Link href="/" className="flex items-center gap-3"><img src="/petwo-logo.svg" alt="PETWO" className="h-10 w-auto" /><span className="hidden text-sm font-semibold text-slate-500 sm:inline">Pet care directory</span></Link>
      <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-teal-800 hover:text-teal-950"><ArrowLeft className="h-4 w-4" /> Home</Link>
    </div></header>
    <section className="mx-auto max-w-6xl px-5 pb-16 pt-12 sm:px-8">
      <div className="max-w-2xl"><p className="text-xs font-extrabold uppercase tracking-[.2em] text-teal-700">Discover trusted care</p><h1 className="mt-3 text-4xl font-extrabold tracking-tight sm:text-5xl">Find the right care for your pet.</h1><p className="mt-4 leading-7 text-slate-600">Explore PETWO providers that have been approved for listing. Search by clinic name, service area or description.</p></div>
      <div className="mt-8 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:flex-row">
        <label className="flex min-h-12 flex-1 items-center gap-3 rounded-xl bg-slate-50 px-4"><Search className="h-5 w-5 text-slate-400" /><span className="sr-only">Search clinics</span><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search clinics or city..." className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400" /></label>
        <button type="button" onClick={requestLocation} disabled={locationLoading} className="inline-flex items-center justify-center gap-2 rounded-xl border border-teal-200 px-4 py-3 text-sm font-bold text-teal-800 hover:bg-teal-50 disabled:opacity-50"><MapPin className="h-4 w-4" />{locationLoading ? 'Locating…' : coordinates ? 'Location enabled' : 'Use my location'}</button>
        <label className="flex items-center gap-2 px-2 text-sm font-semibold text-slate-600">Sort
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-teal-600/20"><option value="recommended">Recommended</option><option value="highest_rated">Highest rated</option><option value="most_reviewed">Most reviewed</option><option value="nearest">Nearest first</option></select>
        </label>
      </div>
      {locationMessage && <p role="status" className="mt-3 text-xs text-slate-500">{locationMessage}</p>}
      <div className="mt-8 flex items-center justify-between"><h2 className="text-lg font-extrabold">Approved care providers</h2><span className="text-sm text-slate-500">{loading ? 'Loading…' : providers.length + ' found'}</span></div>
      {error && <div role="alert" className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div>}
      {loading ? <div className="mt-6 grid gap-4 md:grid-cols-2"><div className="h-44 animate-pulse rounded-2xl bg-slate-200" /><div className="h-44 animate-pulse rounded-2xl bg-slate-200" /></div> :
      providers.length ? <div className="mt-6 grid gap-4 md:grid-cols-2">{providers.map(provider => <article key={provider.id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-lg">
        <div className="flex items-start justify-between gap-4"><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-800"><Stethoscope className="h-6 w-6" /></div><span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800"><ShieldCheck className="h-3.5 w-3.5" /> Approved</span></div>
        <h3 className="mt-4 text-xl font-extrabold">{provider.businessName}</h3><p className="mt-1 text-xs font-semibold uppercase tracking-wide text-teal-700">{(provider.businessType || 'pet care provider').replaceAll('_',' ')}</p>
        <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">{provider.tagline || provider.description || 'Pet care services listed on PETWO.'}</p>
        <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-500">{provider.address?.city && <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{provider.address.city}{provider.address.state ? ', '+provider.address.state : ''}</span>}{typeof provider.distanceKm === 'number' && <span>{provider.distanceKm.toFixed(1)} km away</span>}<span className="inline-flex items-center gap-1"><Star className="h-3.5 w-3.5 text-amber-500" />{typeof provider.rating === 'number' ? provider.rating.toFixed(1) : 'New'}{provider.reviewCount ? ' · '+provider.reviewCount+' reviews' : ''}</span></div>
        <Link href={'/care/'+encodeURIComponent(provider.id)} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#087f70] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#066b60]">View clinic <ArrowRight className="h-4 w-4" /></Link>
      </article>)}</div> : <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center"><Stethoscope className="mx-auto h-8 w-8 text-slate-300" /><h3 className="mt-3 font-bold">No approved providers found yet</h3><p className="mt-2 text-sm text-slate-500">Try another search, or check again as more clinics join PETWO.</p></div>}
      <p className="mt-8 text-xs leading-5 text-slate-400">Only active, approved providers are listed. Location access is optional and is used only to calculate nearby distances; your browser will ask before sharing it. You can search by clinic or city without enabling location.</p>
    </section>
  </main>;
}
