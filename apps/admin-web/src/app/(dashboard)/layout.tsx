'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Calendar, Percent, Ticket, Headphones, FileText,
  ShieldCheck, Menu, X, PawPrint,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const adminNav = [
  { href: '/overview', label: 'Platform Overview', icon: LayoutDashboard },
  { href: '/providers', label: 'Provider Verification', icon: ShieldCheck },
  { href: '/bookings', label: 'Bookings & Orders', icon: Calendar },
  { href: '/commissions', label: 'Commissions & Fees', icon: Percent },
  { href: '/coupons', label: 'Coupons & Promos', icon: Ticket },
  { href: '/support', label: 'Support & Disputes', icon: Headphones },
  { href: '/audit-logs', label: 'System Audit Logs', icon: FileText },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const navigation = (
    <nav className="space-y-1 px-3 py-5">
      <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
        Workspace
      </p>
      {adminNav.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || (href !== '/overview' && pathname?.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            onClick={() => setMobileNavOpen(false)}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all duration-200',
              active
                ? 'bg-teal-600 text-white shadow-lg shadow-teal-950/20'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white',
            )}
          >
            <Icon className={cn('h-[18px] w-[18px] shrink-0', active ? 'text-white' : 'text-slate-500 group-hover:text-teal-300')} />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );

  const sidebar = (
    <div className="flex h-full flex-col bg-[#102f4d] text-slate-200">
      <div className="flex h-[76px] items-center justify-between border-b border-white/10 px-5">
        <Link href="/overview" className="inline-flex items-center rounded-xl bg-white px-3 py-2">
          <img src="/petwo-logo.svg" alt="PETWO" className="h-9 w-auto max-w-[164px] object-contain" />
        </Link>
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setMobileNavOpen(false)}
          className="rounded-lg p-2 text-slate-300 hover:bg-white/10 lg:hidden"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      {navigation}
      <div className="mt-auto border-t border-white/10 p-4">
        <div className="rounded-xl bg-white/5 p-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-teal-200">
            <span className="h-2 w-2 rounded-full bg-teal-400" />
            PETWO Operations
          </div>
          <p className="mt-1.5 text-[11px] leading-relaxed text-slate-400">
            Marketplace administration workspace
          </p>
        </div>
        <p className="mt-3 text-center text-[10px] text-slate-500">PETWO · Admin Portal</p>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="sticky top-0 hidden h-screen w-[268px] shrink-0 lg:block">
        {sidebar}
      </aside>

      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation overlay"
            onClick={() => setMobileNavOpen(false)}
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
          />
          <aside className="relative z-10 h-full w-[min(86vw,300px)] shadow-2xl">
            {sidebar}
          </aside>
        </div>
      )}

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-[76px] items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur-xl sm:px-6 lg:px-9">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              aria-label="Open navigation"
              onClick={() => setMobileNavOpen(true)}
              className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900 sm:text-base">
                Marketplace operations
              </p>
              <p className="hidden text-xs text-slate-500 sm:block">
                PETWO Central Administration
              </p>
            </div>
          </div>
          <div className="ml-3 flex shrink-0 items-center gap-2 rounded-full border border-teal-100 bg-teal-50 px-3 py-1.5">
            <PawPrint className="h-3.5 w-3.5 text-teal-700" />
            <span className="text-[11px] font-semibold text-teal-800 sm:text-xs">Admin workspace</span>
          </div>
        </header>

        <main className="w-full flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-9">
          <div className="mx-auto w-full max-w-[1440px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
