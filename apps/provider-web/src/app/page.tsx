import Link from 'next/link';
import { ArrowRight, CalendarCheck, HeartHandshake, MapPin, PawPrint, ShieldCheck, Star } from 'lucide-react';

const services = [
  { icon: HeartHandshake, title: 'Veterinary care', description: 'Find approved veterinary clinics and pet-care professionals.', href: '/care' },
  { icon: CalendarCheck, title: 'Easy appointments', description: 'Explore clinic services and see the care options they offer.', href: '/care' },
  { icon: ShieldCheck, title: 'Care you can trust', description: 'Browse approved providers and compare published ratings.', href: '/care?sortBy=highest_rated' },
];

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#f7faf8] text-slate-900">
      <header className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
        <Link href="/" aria-label="PETWO home" className="inline-flex items-center gap-3">
          <img src="/petwo-logo.svg" alt="PETWO" className="h-11 w-auto" />
        </Link>
        <nav className="hidden items-center gap-8 text-sm font-semibold text-slate-600 md:flex">
          <a href="#services" className="transition hover:text-teal-800">Explore care</a>
          <a href="#how-it-works" className="transition hover:text-teal-800">How it works</a>
          <a href="#providers" className="transition hover:text-teal-800">For providers</a>
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/login" className="rounded-xl px-3 py-2.5 text-sm font-bold text-teal-800 transition hover:bg-teal-50 sm:px-4">Provider login</Link>
          <a href="#services" className="hidden rounded-xl bg-[#087f70] px-4 py-3 text-sm font-bold text-white shadow-lg shadow-teal-900/10 transition hover:-translate-y-0.5 hover:bg-[#066b60] sm:inline-flex">Explore PETWO <ArrowRight className="ml-2 h-4 w-4" /></a>
        </div>
      </header>

      <section className="relative mx-auto grid max-w-7xl items-center gap-10 px-5 pb-20 pt-10 sm:px-8 lg:grid-cols-[1.03fr_0.97fr] lg:pb-28 lg:pt-16">
        <div className="pointer-events-none absolute -left-40 top-0 h-96 w-96 rounded-full bg-emerald-200/40 blur-3xl" />
        <div className="relative z-10">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-teal-100 bg-white px-4 py-2 text-xs font-bold tracking-wide text-teal-800 shadow-sm">
            <PawPrint className="h-4 w-4" /> A happier way to care for pets
          </div>
          <h1 className="max-w-2xl text-5xl font-extrabold leading-[1.06] tracking-tight text-slate-950 sm:text-6xl xl:text-7xl">
            Every paw deserves <span className="text-[#078573]">the best care.</span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-8 text-slate-600 sm:text-lg">
            PETWO is building a simpler connection between pet parents and the people who care for their furry family — from veterinary visits to everyday wellbeing.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <a href="#services" className="inline-flex items-center justify-center rounded-xl bg-[#087f70] px-6 py-4 text-sm font-bold text-white shadow-xl shadow-teal-900/15 transition hover:-translate-y-0.5 hover:bg-[#066b60]">Explore pet care <ArrowRight className="ml-2 h-4 w-4" /></a>
            <Link href="/login" className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-6 py-4 text-sm font-bold text-slate-700 transition hover:border-teal-200 hover:bg-teal-50">I'm a care provider</Link>
          </div>
          <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-sm font-medium text-slate-500">
            <span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-teal-700" /> Pet-first experience</span>
            <span className="inline-flex items-center gap-2"><HeartHandshake className="h-4 w-4 text-teal-700" /> Care-focused platform</span>
          </div>
        </div>
        <div className="relative mx-auto w-full max-w-xl">
          <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-amber-100 blur-2xl" />
          <div className="absolute -bottom-8 -left-8 h-40 w-40 rounded-full bg-teal-200/60 blur-2xl" />
          <div className="relative overflow-hidden rounded-[2.5rem] border border-white bg-[#e5f3ed] p-5 shadow-[0_35px_90px_-35px_rgba(8,87,75,0.35)] sm:p-8">
            <img src="/pet-care-illustration.svg" alt="A friendly dog and cat with pet care essentials" className="mx-auto aspect-[4/3] w-full object-contain" />
            <div className="mx-auto mt-1 max-w-sm rounded-2xl border border-white/80 bg-white/90 p-4 shadow-lg backdrop-blur">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 text-amber-700"><Star className="h-5 w-5 fill-current" /></div>
                <div><p className="text-sm font-extrabold text-slate-900">Care starts with connection</p><p className="mt-1 text-xs text-slate-500">Helping pets and their people thrive</p></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="services" className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="max-w-2xl"><p className="text-xs font-extrabold uppercase tracking-[0.2em] text-teal-700">Made around their wellbeing</p><h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">Care for every stage of their journey.</h2><p className="mt-4 leading-7 text-slate-600">A single place designed to make finding and managing pet care feel more straightforward.</p></div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {services.map(({ icon: Icon, title, description, href }) => <Link key={title} href={href} className="group block rounded-3xl border border-slate-100 bg-[#fbfdfc] p-7 transition duration-200 hover:-translate-y-1 hover:border-teal-200 hover:shadow-xl hover:shadow-teal-900/5 focus:outline-none focus:ring-4 focus:ring-teal-600/20"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-800 transition group-hover:bg-teal-100"><Icon className="h-6 w-6" /></div><h3 className="mt-6 flex items-center justify-between text-lg font-extrabold">{title}<ArrowRight className="h-4 w-4 text-teal-700 transition group-hover:translate-x-1" /></h3><p className="mt-3 text-sm leading-7 text-slate-600">{description}</p><span className="mt-5 inline-flex text-xs font-bold text-teal-800">Explore now <ArrowRight className="ml-1 h-3.5 w-3.5" /></span></Link>)}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="mx-auto grid max-w-7xl gap-10 px-5 py-20 sm:px-8 lg:grid-cols-2 lg:items-center">
        <div><p className="text-xs font-extrabold uppercase tracking-[0.2em] text-teal-700">Simple by design</p><h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">Less searching. More tail wags.</h2><p className="mt-4 max-w-xl leading-7 text-slate-600">Our goal is to make it easier for pet parents to find the right care and for care teams to spend more time doing what matters.</p></div>
        <div className="grid gap-4 sm:grid-cols-2"><div className="rounded-3xl bg-[#eaf5f0] p-6"><MapPin className="h-6 w-6 text-teal-800" /><h3 className="mt-4 font-extrabold">Discover</h3><p className="mt-2 text-sm leading-6 text-slate-600">Explore pet-care services and provider information.</p></div><div className="rounded-3xl bg-[#fff4e5] p-6"><CalendarCheck className="h-6 w-6 text-amber-700" /><h3 className="mt-4 font-extrabold">Connect</h3><p className="mt-2 text-sm leading-6 text-slate-600">Move toward a more convenient care experience.</p></div></div>
      </section>

      <section id="providers" className="mx-5 mb-16 rounded-[2rem] bg-[#073f3d] px-6 py-12 text-white sm:mx-8 sm:px-12 lg:mx-auto lg:max-w-7xl lg:py-16">
        <div className="flex flex-col justify-between gap-8 md:flex-row md:items-center"><div className="max-w-2xl"><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#9be4ce]">For clinics and care teams</p><h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">Bring your pet-care business to PETWO.</h2><p className="mt-4 leading-7 text-teal-50/75">Manage your services, appointments and customer relationships from the provider portal.</p></div><Link href="/login" className="inline-flex shrink-0 items-center justify-center rounded-xl bg-white px-6 py-4 text-sm font-extrabold text-teal-900 transition hover:-translate-y-0.5 hover:bg-teal-50">Open provider portal <ArrowRight className="ml-2 h-4 w-4" /></Link></div>
      </section>

      <footer className="mx-auto flex max-w-7xl flex-col gap-3 px-5 pb-8 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between sm:px-8"><span>© {new Date().getFullYear()} PETWO. Made for every paw.</span><span>Pet care, connected with care.</span></footer>
    </main>
  );
}
