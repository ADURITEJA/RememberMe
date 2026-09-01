"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Users } from "lucide-react";

/**
 * Caregiver Mode ─ active patient context + switcher.
 *
 * The `PatientProvider` (rendered by the (caregiver) layout) wraps the whole
 * mode and exposes the list of linked patients and the currently-active one.
 * It is driven by the `?patient=<profileId>` search param so every server
 * page re-fetches against the chosen patient. Switching patient simply
 * rewrites that param on the current URL.
 */

export interface PatientOption {
  id: string;
  name: string;
  email?: string | null;
}

interface PatientContextValue {
  patients: PatientOption[];
  activeId: string | null;
  active: PatientOption | null;
  /** Navigate to the current page scoped to a different patient. */
  setActiveId: (id: string) => void;
}

const PatientContext = React.createContext<PatientContextValue | null>(null);

export function usePatient(): PatientContextValue {
  const ctx = React.useContext(PatientContext);
  if (!ctx) {
    throw new Error("usePatient must be used within a <PatientProvider>");
  }
  return ctx;
}

/**
 * Client wrapper: exposes the patients list + active patient to the chrome
 * and lets the switcher re-scope the whole mode to another patient.
 */
export function PatientProvider({
  patients,
  children,
}: {
  patients: PatientOption[];
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Active patient is derived from the `?patient=` search param (set by the
  // switcher), falling back to the first linked patient.
  const activeId = React.useMemo(() => {
    const raw = searchParams.get("patient");
    if (raw && patients.some((p) => p.id === raw)) return raw;
    return patients[0]?.id ?? null;
  }, [searchParams, patients]);

  const active = React.useMemo(
    () => patients.find((p) => p.id === activeId) ?? null,
    [patients, activeId],
  );

  const setActiveId = React.useCallback(
    (id: string) => {
      if (id === activeId) return;
      // Rewrite the `patient` search param, preserving any others (date, tab…).
      const params = new URLSearchParams(searchParams.toString());
      params.set("patient", id);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [activeId, searchParams, pathname, router],
  );

  const value = React.useMemo<PatientContextValue>(
    () => ({ patients, activeId, active, setActiveId }),
    [patients, activeId, active, setActiveId],
  );

  return (
    <PatientContext.Provider value={value}>{children}</PatientContext.Provider>
  );
}

/**
 * Dropdown that switches which patient the caregiver is viewing. Used in the
 * top bar (desktop) and inside the mobile drawer.
 */
export function PatientSwitcher({
  className,
  label,
}: {
  className?: string;
  label?: string;
}) {
  const { patients, activeId, setActiveId } = usePatient();

  if (patients.length === 0) {
    return (
      <span className="inline-flex items-center gap-2 rounded-2xl border border-dashed border-remme-sage/40 px-4 py-2 text-base font-medium text-remme-ink/60">
        <Users aria-hidden className="h-5 w-5" />
        No patients linked yet
      </span>
    );
  }

  return (
    <label className={className}>
      {label ? (
        <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-remme-ink/50">
          {label}
        </span>
      ) : null}
      <span className="relative inline-flex w-full items-center">
        <Users
          aria-hidden
          className="pointer-events-none absolute left-3.5 h-5 w-5 text-remme-sage-deep"
        />
        <select
          aria-label="Switch patient"
          value={activeId ?? ""}
          onChange={(e) => setActiveId(e.target.value)}
          className="min-h-12 w-full appearance-none rounded-2xl border border-remme-sage/25 bg-white/80 pl-11 pr-10 text-lg font-medium text-remme-ink shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-remme-sage/30 dark:bg-remme-charcoal/80 dark:text-remme-inklight"
        >
          {patients.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <svg
          aria-hidden
          className="pointer-events-none absolute right-3.5 h-5 w-5 text-remme-ink/50"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </span>
    </label>
  );
}
