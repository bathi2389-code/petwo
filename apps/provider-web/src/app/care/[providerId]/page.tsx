'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ArrowLeft, CalendarDays, MapPin, ShieldCheck, Star, Stethoscope } from 'lucide-react';
import { apiClient } from '@/lib/api-client';

type Provider = { id:string; businessName:string; businessType?:string; description?:string; tagline?:string; contact?:{phone?:string;email?:string}; address?:{line1?:string;line2?:string;city?:string;state?:string;pincode?:string}; rating?:number; reviewCount?:number; verificationStatus?:string };
type Service = { id:string; name:string; description?:string; duration?:number; price?:{amount:number;currency?:string;priceType?:string}; allowedPetSpecies?:string[] };

export default function ProviderDetailsPage() {
  const params = useParams();
  const providerId = String(params.providerId || '');
  const [provider,setProvider] = useState<Provider|null>(null);
  const [services,setServices] = useState<Service[]>([]);
  const [loading,setLoading] = useState(true);
  const [error,setError] = useState('');
  useEffect(() => {
    if (!providerId) return;
    let active=true;
    Promise.all([
      apiClient.get('/providers/'+encodeURIComponent(providerId)),
      apiClient.get('/services',{params:{providerId,limit:50}})
    ]).then(([p,s]) => { if(active){setProvider(p.data?.data ?? null);setServices(s.data?.data ?? []);} })
      .catch(err => { if(active)setError(err?.message || 'Could not load this provider profile.'); })
      .finally(()=>{if(active)setLoading(false);});
    return ()=>{active=false;};
  },[providerId]);
  const address=[provider?.address?.line1,provider?.address?.line2,provider?.address?.city,provider?.address?.state,provider?.address?.pincode].filter(Boolean).join(', ');
  return <main className="min-h-screen bg-[#f6faf8] text-slate-900">
    <header className="border-b border-slate-100 bg-white"><div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-5 sm:px-8"><Link href="/" aria-label="PETWO home"><img src="/petwo-logo.svg" alt="PETWO" className="h-10 w-auto"/></Link><Link href="/care" className="inline-flex items-center gap-2 text-sm font-semibold text-teal-800"><ArrowLeft className="h-4 w-4"/> All providers</Link></div></header>
    <section className="mx-auto max-w-5xl px-5 py-10 sm:px-8">
      {loading ? <div className="h-64 animate-pulse rounded-3xl bg-slate-200"/> : error ? <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">{error}<p className="mt-3"><Link href="/care" className="font-bold underline">Return to directory</Link></p></div> : provider ? <>
        <div className="rounded-3xl bg-[#073f3d] p-7 text-white sm:p-10"><div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-teal-100"><ShieldCheck className="h-4 w-4"/> PETWO approved provider</div><h1 className="mt-4 text-3xl font-extrabold sm:text-4xl">{provider.businessName}</h1><p className="mt-2 text-sm font-semibold capitalize text-teal-100">{(provider.businessType||'pet care provider').replaceAll('_',' ')}</p>{provider.tagline && <p className="mt-4 max-w-2xl text-teal-50/85">{provider.tagline}</p>}<div className="mt-6 flex flex-wrap gap-5 text-sm text-teal-50/90"><span className="inline-flex items-center gap-2"><Star className="h-4 w-4 text-amber-300"/>{typeof provider.rating==='number'?provider.rating.toFixed(1)+' rating':'No published rating'}{provider.reviewCount?' · '+provider.reviewCount+' reviews':''}</span>{address && <span className="inline-flex items-center gap-2"><MapPin className="h-4 w-4"/>{address}</span>}</div></div>
        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]"><section className="rounded-2xl border border-slate-200 bg-white p-6"><h2 className="text-xl font-extrabold">About this provider</h2><p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-600">{provider.description || 'This provider has not added a description yet.'}</p><div className="mt-8 flex items-center gap-2"><Stethoscope className="h-5 w-5 text-teal-700"/><h2 className="text-xl font-extrabold">Services</h2></div>{services.length ? <div className="mt-4 divide-y divide-slate-100">{services.map(service=><article key={service.id} className="py-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-bold">{service.name}</h3>{service.description&&<p className="mt-1 text-sm leading-6 text-slate-500">{service.description}</p>}{service.duration ? <p className="mt-2 text-xs text-slate-400">{service.duration} minutes</p>:null}</div>{service.price&&<span className="rounded-lg bg-teal-50 px-3 py-2 text-sm font-extrabold text-teal-800">₹{(service.price.amount/100).toLocaleString('en-IN')}</span>}</div></article>)}</div>:<p className="mt-3 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">No active services have been published by this provider yet.</p>}</section>
        <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-6"><h2 className="font-extrabold">Contact details</h2>{provider.contact?.phone&&<p className="mt-4 text-sm text-slate-600">Phone: <a className="font-semibold text-teal-800 hover:underline" href={'tel:'+provider.contact.phone}>{provider.contact.phone}</a></p>}{provider.contact?.email&&<p className="mt-2 break-all text-sm text-slate-600">Email: <a className="font-semibold text-teal-800 hover:underline" href={'mailto:'+provider.contact.email}>{provider.contact.email}</a></p>}<div className="mt-6 rounded-xl bg-amber-50 p-4"><div className="flex items-center gap-2 text-sm font-bold text-amber-900"><CalendarDays className="h-4 w-4"/> Online booking</div><p className="mt-2 text-xs leading-5 text-amber-800">Booking from the web portal is not enabled yet. Contact the provider directly to arrange a visit.</p></div><Link href="/care" className="mt-5 block rounded-xl border border-slate-200 px-4 py-3 text-center text-sm font-bold text-slate-700 hover:bg-slate-50">Back to providers</Link></aside></div>
      </>:<div className="rounded-2xl bg-white p-8 text-center">Provider not found. <Link href="/care" className="font-bold text-teal-800 underline">Browse providers</Link></div>}
    </section>
  </main>;
}
