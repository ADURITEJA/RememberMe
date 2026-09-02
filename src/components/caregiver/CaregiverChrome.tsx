"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BellRing,
  Pill,
  Sparkles,
  Users,
  Siren,
  MapPin,
  FileText,
  CalendarDays,
  Settings,
  HeartHandshake,
  Menu,
  X,
  Phone,
  MapPinned,
  Shield,
  Smile,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PatientSwitcher, usePatient } from "./PatientSwitcher";

const NAV = [
  { href: "/caregiver/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/caregiver/reminders", label: "Reminders", icon: BellRing },
  { href: "/caregiver/medications", label: "Meds", icon: Pill },
  { href: "/caregiver/routines", label: "Routines", icon: CalendarDays },
  { href: "/caregiver/memories", label: "Memory", icon: Sparkles },
  { href: "/caregiver/mood", label: "Mood", icon: Smile },
  { href: "/caregiver/people", label: "People", icon: Users },
  { href: "/caregiver/emergency-contacts", label: "SOS Contacts", icon: Phone },
  { href: "/caregiver/places", label: "Places", icon: MapPinned },
  { href: "/caregiver/alerts", label: "Alerts", icon: Siren },
  { href: "/caregiver/location", label: "Zones", icon: Shield },
  { href: "/caregiver/reports", label: "Reports", icon: FileText },
  { href: "/caregiver/settings", label: "Settings", icon: Settings },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-0.5" aria-label="Caregiver navigation">
      {NAV.map((item) => {
        const active =
          pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex min-h-11 items-center gap-3 rounded-[980px] px-4 py-2 text-[15px] font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0071e3]/40",
              active
                ? "bg-[#0071e3]/10 text-[#0071e3]"
                : "text-[#1d1d1f] hover:bg-[#f5f5f7] dark:text-[#f5f5f7]",
            )}
            aria-current={active ? "page" : undefined}
          >
            <Icon aria-hidden className="h-5 w-5" strokeWidth={1.5} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function BrandBlock({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <Link
      href="/caregiver/dashboard"
      onClick={onNavigate}
      className="flex min-h-12 items-center gap-2.5 rounded-[980px] px-3 text-[#1d1d1f] transition-all duration-200 hover:bg-[#f5f5f7] dark:text-[#f5f5f7]"
      aria-label="Remme Caregiver home"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0071e3] text-white">
        <HeartHandshake aria-hidden className="h-5 w-5" strokeWidth={1.5} />
      </span>
      <span className="flex flex-col leading-tight">
        <span className="text-base font-semibold tracking-tight">Remme</span>
        <span className="text-xs font-medium text-[#86868b]">Caregiver</span>
      </span>
    </Link>
  );
}

/**
 * Caregiver Mode chrome: an Apple-style glass sidebar on desktop, a sticky
 * top bar with the patient switcher, and a slide-in drawer on mobile.
 */
export default function CaregiverChrome({
  children,
}: {
  children: React.ReactNode;
}) {
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const { active } = usePatient();
  const pathname = usePathname();

  React.useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  const pageTitle = NAV.find((n) => pathname.startsWith(n.href))?.label ?? "Caregiver";

  return (
    <div className="flex min-h-dvh">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col gap-6 border-r border-[rgba(0,0,0,0.05)] bg-white/72 p-5 backdrop-blur-[20px] saturate-[180%] lg:flex dark:bg-black/50">
        <BrandBlock />
        <NavLinks />
        <div className="mt-auto rounded-[18px] bg-[#0071e3]/5 p-4 text-sm leading-relaxed text-[#86868b]">
          <span className="font-semibold text-[#1d1d1f]">Caring for</span> someone?
          Every detail you see here is read-only on their behalf.
        </div>
      </aside>

      {/* Mobile drawer */}
      {drawerOpen ? (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setDrawerOpen(false)}
          aria-hidden="true"
        />
      ) : null}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col gap-6 bg-white/95 p-5 shadow-[0_4px_24px_0_rgba(0,0,0,0.08),0_24px_60px_0_rgba(0,0,0,0.06)] transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] lg:hidden dark:bg-[#1d1d1f]",
          drawerOpen ? "translate-x-0" : "-translate-x-full",
        )}
        aria-hidden={!drawerOpen}
      >
        <div className="flex items-center justify-between">
          <BrandBlock onNavigate={() => setDrawerOpen(false)} />
          <button
            type="button"
            onClick={() => setDrawerOpen(false)}
            aria-label="Close menu"
            className="min-touch rounded-[980px] p-2 text-[#86868b] hover:bg-[#f5f5f7]"
          >
            <X aria-hidden className="h-6 w-6" strokeWidth={1.5} />
          </button>
        </div>
        <NavLinks onNavigate={() => setDrawerOpen(false)} />
        <PatientSwitcher className="mt-auto" />
      </aside>

      {/* Main column */}
      <div className="flex min-h-dvh w-full flex-col lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white/72 backdrop-blur-[20px] saturate-[180%] border-b border-[rgba(0,0,0,0.05)] dark:bg-black/50">
          <div className="flex min-h-16 items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                aria-label="Open menu"
                className="min-touch inline-flex rounded-[980px] p-2 text-[#86868b] hover:bg-[#f5f5f7] lg:hidden"
              >
                <Menu aria-hidden className="h-6 w-6" strokeWidth={1.5} />
              </button>
              <div className="leading-tight">
                <h1 className="text-lg font-semibold tracking-tight text-[#1d1d1f] dark:text-[#f5f5f7]">
                  {pageTitle}
                </h1>
                <p className="hidden text-sm text-[#86868b] sm:block">
                  {active ? `Viewing ${active.name}'s care` : "No patient selected"}
                </p>
              </div>
            </div>
            <div className="hidden w-56 sm:block">
              <PatientSwitcher />
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6">
          {children}
        </main>
      </div>
    </div>
  );
}
