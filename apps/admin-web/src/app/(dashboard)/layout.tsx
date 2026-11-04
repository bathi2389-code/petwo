'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, ShieldAlert, Users, Calendar,
  CreditCard, Percent, Ticket, Headphones, FileText,
  LogOut, ShieldCheck
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

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col justify-between shadow-xl">
        <div>
          {/* Brand header */}
          <div className="h-16 flex items-center px-6 gap-3 border-b border-slate-800">
            <img src="/petwo-logo.svg" alt="PETWO" className="h-10 w-auto max-w-[150px] object-contain transition-transform duration-300 hover:scale-[1.03]" />
            <div>
              <span className="font-bold text-white text-base">PETWO</span>
              <span className="text-[10px] uppercase font-semibold tracking-wider text-teal-300 block">
                Central Admin
              </span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="p-4 space-y-1">
            {adminNav.map(({ href, label, icon: Icon }) => {
              const active = pathname?.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition',
                    active
                      ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-slate-800 text-xs text-slate-500">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-slate-400 font-medium">Hyderabad Hub Online</span>
          </div>
          <div>PETWO SaaS v1.0.0-prod</div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between shadow-sm">
          <h2 className="text-sm font-semibold text-slate-700">
            Marketplace Administration: Telangana State Jurisdiction
          </h2>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-amber-50 text-amber-700 text-xs font-semibold rounded-full border border-amber-200">
              Super Admin Mode
            </span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
