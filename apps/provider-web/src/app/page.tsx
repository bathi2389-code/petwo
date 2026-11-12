import Link from 'next/link';
import {
  ArrowRight, CalendarCheck, HeartHandshake, PawPrint, ShieldCheck,
  Star, Stethoscope, Scissors, Activity, Home as HomeIcon, Building2, Sparkles,
} from 'lucide-react';

const careCategories = [
  { icon: Stethoscope, title: 'Veterinary care', description: 'Clinics, hospitals and trusted veterinary professionals.', tone: 'bg-emerald-50 text-emerald-700' },
  { icon: Scissors, title: 'Grooming & bathing', description: 'At-home and in-clinic grooming for healthier, happier pets.', tone: 'bg-orange-50 text-orange-700' },
  { icon: Activity, title: 'Physiotherapy', description: 'Mobility, rehabilitation and recovery-focused care.', tone: 'bg-indigo-50 text-indigo-700' },
  { icon: HomeIcon, title: 'Boarding & daycare', description: 'A comfortable place for pets when you are away.', tone: 'bg-fuchsia-50 text-fuchsia-700' },
];

const customerBenefits = [
  'Discover approved pet-care providers',
  'Compare genuine ratings and feedback',
  'Manage pet profiles and appointments',
];

const providerBenefits = [
  'Create and manage your business profile',
  'Publish services and available time slots',
  'Receive and manage customer appointments',
];

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#f6faf8] text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <Link href="/" aria-label="PETWO home" className="shrink-0">
            <img src="/petwo-logo.svg" alt="PETWO" className="h-10 w-auto" />
          </Link>
          <nav className="hidden items-center gap-7 text-sm font-semibold text-slate-600 md:flex">
            <a href="#portals" className="transition hover:text-teal-800">Choose your portal</a>
            <a href="#care" className="transition hover:text-teal-800">Care services</a>
          </nav>
          <Link href="/customer/login" className="inline-flex items-center rounded-xl px-3 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-100">
            Sign in
          </Link>
        </div>
      </header>

      <section className="relative mx-auto grid max-w-7xl items-center gap-10 px-5 pb-12 pt-12 sm:px-8 lg:grid-cols-[1.02fr_.98fr] lg:pb-16 lg:pt-16">
        <div className="pointer-events-none absolute -left-40 top-0 h-96 w-96 rounded-full bg-emerald-200/45 blur-3xl" />
        <div className="relative z-10">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-teal-100 bg-white px-4 py-2 text-xs font-extrabold tracking-wide text-teal-800 shadow-sm">
            <PawPrint className="h-4 w-4" /> A little more love in every visit
          </div>
          <h1 className="max-w-2xl text-5xl font-black leading-[1.04] tracking-tight text-slate-950 sm:text-6xl xl:text-[4.35rem]">
            Better pet care.
            <span className="block text-[#078573]">Happier every day.</span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-8 text-slate-600 sm:text-lg">
            One connected place for pet parents to find trusted care teams and for providers to grow the care they deliver.
          </p>
          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold text-slate-500">
            <span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-teal-700" /> Approved providers</span>
            <span className="inline-flex items-center gap-2"><Star className="h-4 w-4 text-amber-500" /> Ratings & feedback</span>
            <span className="inline-flex items-center gap-2"><HeartHandshake className="h-4 w-4 text-teal-700" /> Care built around pets</span>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-xl">
          <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-amber-100 blur-2xl" />
          <div className="absolute -bottom-8 -left-8 h-40 w-40 rounded-full bg-teal-200/60 blur-2xl" />
          <div className="relative overflow-hidden rounded-[2.5rem] border border-white bg-[#e5f3ed] p-5 shadow-[0_35px_90px_-35px_rgba(8,87,75,0.35)] sm:p-8">
            <img src="/pet-care-illustration.svg" alt="A friendly dog and cat with pet-care essentials" className="mx-auto aspect-[4/3] w-full object-contain" />
            <div className="mx-auto mt-1 max-w-sm rounded-2xl border border-white/80 bg-white/95 p-4 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 text-amber-700"><Sparkles className="h-5 w-5" /></div>
                <div><p className="text-sm font-extrabold text-slate-900">Every paw deserves great care</p><p className="mt-1 text-xs text-slate-500">Choose the PETWO experience that fits you</p></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="portals" className="mx-auto max-w-7xl scroll-mt-24 px-5 pb-20 pt-8 sm:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-extrabold uppercase tracking-[.2em] text-teal-700">Welcome to PETWO</p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">How would you like to use PETWO?</h2>
          <p className="mt-4 text-sm leading-7 text-slate-600 sm:text-base">Choose your portal to get the right tools and experience. Pet parents and care providers have separate accounts and workspaces.</p>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <article className="group relative overflow-hidden rounded-[2rem] border border-teal-100 bg-white p-7 shadow-[0_20px_65px_-42px_rgba(8,87,75,.35)] transition duration-300 hover:-translate-y-1 hover:shadow-xl sm:p-9">
            <div className="absolute -right-14 -top-16 h-48 w-48 rounded-full bg-teal-50 transition group-hover:scale-110" />
            <div className="relative">
              <div className="flex items-start justify-between gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-100 text-teal-800"><PawPrint className="h-7 w-7" /></div>
                <span className="rounded-full bg-teal-50 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[.16em] text-teal-800">For pet parents</span>
              </div>
              <h3 className="mt-7 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">Find Pet Care</h3>
              <p className="mt-3 max-w-md text-sm leading-7 text-slate-600">Find the right clinic, veterinarian or care service for your furry family. Keep your pet details and appointments together.</p>
              <ul className="mt-6 space-y-3">
                {customerBenefits.map(item => <li key={item} className="flex items-center gap-3 text-sm font-semibold text-slate-700"><span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-teal-100 text-teal-800">✓</span>{item}</li>)}
              </ul>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/care" className="inline-flex min-h-12 flex-1 items-center justify-center rounded-xl bg-[#087f70] px-5 py-3 text-sm font-extrabold text-white shadow-lg shadow-teal-900/10 transition hover:bg-[#066b60]">Explore pet care <ArrowRight className="ml-2 h-4 w-4" /></Link>
                <Link href="/customer/login" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 transition hover:border-teal-200 hover:bg-teal-50">Customer sign in</Link>
              </div>
              <p className="mt-4 text-xs text-slate-400">New to PETWO? <Link href="/customer/register" className="font-bold text-teal-800 hover:underline">Create a pet-parent account</Link>.</p>
            </div>
          </article>

          <article className="group relative overflow-hidden rounded-[2rem] border border-slate-200 bg-[#073f3d] p-7 text-white shadow-[0_20px_65px_-42px_rgba(7,63,61,.55)] transition duration-300 hover:-translate-y-1 hover:shadow-xl sm:p-9">
            <div className="absolute -right-14 -top-16 h-48 w-48 rounded-full bg-white/5 transition group-hover:scale-110" />
            <div className="relative">
              <div className="flex items-start justify-between gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-teal-100"><Building2 className="h-7 w-7" /></div>
                <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[.16em] text-teal-100">For care providers</span>
              </div>
              <h3 className="mt-7 text-2xl font-black tracking-tight sm:text-3xl">Join as a Provider</h3>
              <p className="mt-3 max-w-md text-sm leading-7 text-teal-50/75">Bring your clinic, hospital, grooming or pet-care business to PETWO and manage your services and customer appointments in one workspace.</p>
              <ul className="mt-6 space-y-3">
                {providerBenefits.map(item => <li key={item} className="flex items-center gap-3 text-sm font-semibold text-teal-50"><span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 text-teal-100">✓</span>{item}</li>)}
              </ul>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/register" className="inline-flex min-h-12 flex-1 items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-extrabold text-teal-900 transition hover:bg-teal-50">Register your business <ArrowRight className="ml-2 h-4 w-4" /></Link>
                <Link href="/login" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/20 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/10">Provider sign in</Link>
              </div>
              <p className="mt-4 text-xs text-teal-100/60">Already a PETWO partner? <Link href="/login" className="font-bold text-white hover:underline">Open your provider workspace</Link>.</p>
            </div>
          </article>
        </div>
      </section>

      <section id="care" className="border-y border-slate-100 bg-white py-16">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div className="max-w-2xl"><p className="text-xs font-extrabold uppercase tracking-[.2em] text-teal-700">PETWO care network</p><h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Care for every kind of paw.</h2><p className="mt-4 text-sm leading-7 text-slate-600">Pet parents can explore the services they need from approved providers.</p></div>
            <Link href="/care" className="inline-flex items-center gap-2 text-sm font-extrabold text-teal-800 hover:text-teal-950">Browse care providers <ArrowRight className="h-4 w-4" /></Link>
          </div>
          <div className="mt-9 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {careCategories.map(({ icon: Icon, title, description, tone }) => (
              <Link key={title} href="/care" className="group rounded-2xl border border-slate-100 bg-[#fbfdfc] p-5 transition hover:-translate-y-1 hover:border-teal-200 hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-teal-600/20">
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${tone}`}><Icon className="h-5 w-5" /></div>
                <h3 className="mt-5 flex items-center justify-between gap-2 text-sm font-extrabold">{title}<ArrowRight className="h-4 w-4 text-teal-700 transition group-hover:translate-x-1" /></h3>
                <p className="mt-2 text-xs leading-6 text-slate-600">{description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
        <div className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-6 sm:grid-cols-3 sm:p-8">
          <div className="flex items-start gap-3"><div className="rounded-xl bg-teal-50 p-2 text-teal-800"><ShieldCheck className="h-5 w-5" /></div><div><h3 className="text-sm font-extrabold">Verified care partners</h3><p className="mt-1 text-xs leading-5 text-slate-500">Provider listings are subject to PETWO review.</p></div></div>
          <div className="flex items-start gap-3"><div className="rounded-xl bg-amber-50 p-2 text-amber-700"><Star className="h-5 w-5" /></div><div><h3 className="text-sm font-extrabold">Feedback-led discovery</h3><p className="mt-1 text-xs leading-5 text-slate-500">Use available ratings and reviews to compare care.</p></div></div>
          <div className="flex items-start gap-3"><div className="rounded-xl bg-indigo-50 p-2 text-indigo-700"><CalendarCheck className="h-5 w-5" /></div><div><h3 className="text-sm font-extrabold">Separate workspaces</h3><p className="mt-1 text-xs leading-5 text-slate-500">Customers book care; providers manage appointments.</p></div></div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-7 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <span>© {new Date().getFullYear()} PETWO. Made for every paw.</span>
          <div className="flex flex-wrap gap-4"><Link href="/customer/login" className="hover:text-teal-800">Pet parent sign in</Link><Link href="/login" className="hover:text-teal-800">Provider sign in</Link><span>Pet care, connected with care.</span></div>
        </div>
      </footer>
    </main>
  );
}
