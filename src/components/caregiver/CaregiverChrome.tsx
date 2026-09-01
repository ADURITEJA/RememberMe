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
  Settings,
  HeartHandshake,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PatientSwitcher, usePatient } from "./PatientSwitcher";

const NAV = [
  { href: "/caregiver/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/caregiver/reminders", label: "Reminders", icon: BellRing },
  { href: "/caregiver/medications", label: "Meds", icon: Pill },
  { href: "/caregiver/memories", label: "Memory", icon: Sparkles },
  { href: "/caregiver/people", label: "People", icon: Users },
  { href: "/caregiver/alerts", label: "Alerts", icon: Siren },
  { href: "/caregiver/location", label: "Location", icon: MapPin },
  { href: "/caregiver/reports", label: "Reports", icon: FileText },
  { href: "/caregiver/settings", label: "Settings", icon: Settings },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1" aria-label="Caregiver navigation">
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
              "flex min-h-12 items-center gap-3 rounded-2xl px-4 py-2.5 text-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-remme-sage/40",
              active
                ? "bg-remme-sage text-white shadow-sm"
                : "text-remme-ink hover:bg-remme-sage/10 dark:text-remme-inklight",
            )}
            aria-current={active ? "page" : undefined}
          >
            <Icon aria-hidden className="h-5 w-5" />
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
      className="flex min-h-12 items-center gap-2.5 rounded-2xl px-2 text-remme-ink transition-colors hover:bg-remme-sage/10 dark:text-remme-inklight"
      aria-label="Remme Caregiver home"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-remme-sage text-white">
        <HeartHandshake aria-hidden className="h-6 w-6" />
      </span>
      <span className="flex flex-col leading-tight">
        <span className="text-lg font-bold tracking-tight">Remme</span>
        <span className="text-xs font-medium text-remme-sage-deep">Caregiver</span>
      </span>
    </Link>
  );
}

/**
 * Caregiver Mode chrome: a fixed left sidebar on desktop, a sticky top bar
 * with the patient switcher, and a slide-in drawer on mobile.
 */
export default function CaregiverChrome({
  children,
}: {
  children: React.ReactNode;
}) {
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const { active } = usePatient();
  const pathname = usePathname();

  // Close the mobile drawer whenever navigation changes.
  React.useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  const pageTitle = NAV.find((n) => pathname.startsWith(n.href))?.label ?? "Caregiver";

  return (
    <div className="flex min-h-dvh">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col gap-6 border-r border-remme-sage/10 bg-remme-offwhite/80 p-5 backdrop-blur-xl lg:flex dark:bg-remme-charcoal/80">
        <BrandBlock />
        <NavLinks />
        <div className="mt-auto rounded-2xl bg-remme-sage/10 p-4 text-sm leading-relaxed text-remme-sage-deep">
          <span className="font-semibold">Caring for</span> someone? Every detail
          you see here is read-only on their behalf.
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
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col gap-6 bg-remme-offwhite p-5 shadow-glass-lg transition-transform duration-200 lg:hidden dark:bg-remme-charcoal",
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
            className="min-touch rounded-2xl p-2 text-remme-ink/70 hover:bg-remme-sage/10"
          >
            <X aria-hidden className="h-6 w-6" />
          </button>
        </div>
        <NavLinks onNavigate={() => setDrawerOpen(false)} />
        <PatientSwitcher className="mt-auto" />
      </aside>

      {/* Main column */}
      <div className="flex min-h-dvh w-full flex-col lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-remme-offwhite/80 backdrop-blur-xl dark:bg-remme-charcoal/80">
          <div className="flex min-h-16 items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                aria-label="Open menu"
                className="min-touch inline-flex rounded-2xl p-2 text-remme-ink/80 hover:bg-remme-sage/10 lg:hidden"
              >
                <Menu aria-hidden className="h-6 w-6" />
              </button>
              <div className="leading-tight">
                <h1 className="text-xl font-semibold tracking-tight text-remme-ink dark:text-remme-inklight">
                  {pageTitle}
                </h1>
                <p className="hidden text-sm text-remme-ink/55 sm:block">
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
