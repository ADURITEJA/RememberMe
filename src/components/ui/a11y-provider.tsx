"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface A11yTheme {
  reduceTransparency: boolean;
  largeText: boolean;
  highContrast: boolean;
}

interface A11yContextValue {
  theme: A11yTheme;
  setReduceTransparency: (value: boolean) => void;
  setLargeText: (value: boolean) => void;
  setHighContrast: (value: boolean) => void;
}

const A11yContext = React.createContext<A11yContextValue | null>(null);

const STORAGE_KEY = "remme:a11y";

function readInitialTheme(): A11yTheme {
  if (typeof window === "undefined") {
    return { reduceTransparency: false, largeText: false, highContrast: false };
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return { reduceTransparency: false, largeText: false, highContrast: false, ...JSON.parse(raw) };
    }
  } catch {
    /* ignore malformed storage */
  }
  return { reduceTransparency: false, largeText: false, highContrast: false };
}

/**
 * Provides accessibility toggles (reduce transparency / large text /
 * high contrast). Applies `remme-a11y-*` utility classes to <body> so the
 * glass panel utilities can respond. Wraps the app inside the root provider.
 */
function A11yProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = React.useState<A11yTheme>(readInitialTheme);

  React.useEffect(() => {
    const classes = [
      theme.reduceTransparency ? "a11y-reduce-transparency" : "",
      theme.largeText ? "a11y-large-text" : "",
      theme.highContrast ? "a11y-high-contrast" : "",
    ].filter(Boolean);
    const body = document.body;
    body.classList.remove("a11y-reduce-transparency", "a11y-large-text", "a11y-high-contrast");
    if (classes.length > 0) body.classList.add(...classes);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(theme));
    } catch {
      /* ignore */
    }
  }, [theme]);

  const value = React.useMemo<A11yContextValue>(
    () => ({
      theme,
      setReduceTransparency: (v) => setTheme((t) => ({ ...t, reduceTransparency: v })),
      setLargeText: (v) => setTheme((t) => ({ ...t, largeText: v })),
      setHighContrast: (v) => setTheme((t) => ({ ...t, highContrast: v })),
    }),
    [theme],
  );

  return <A11yContext.Provider value={value}>{children}</A11yContext.Provider>;
}

function useA11y(): A11yContextValue {
  const ctx = React.useContext(A11yContext);
  if (!ctx) {
    throw new Error("useA11y must be used within an <A11yProvider>");
  }
  return ctx;
}

/**
 * Ready-to-use accessibility settings row that any settings page can embed.
 */
function A11ySettings({ className }: { className?: string }) {
  const { theme, setReduceTransparency, setLargeText, setHighContrast } = useA11y();

  const Switch = ({
    checked,
    onChange,
    label,
    hint,
  }: {
    checked: boolean;
    onChange: (v: boolean) => void;
    label: string;
    hint?: string;
  }) => (
    <label className="flex items-center justify-between gap-4 rounded-2xl border border-remme-sage/15 bg-white/60 px-5 py-4 min-touch">
      <span>
        <span className="block text-lg font-medium text-remme-ink dark:text-remme-inklight">
          {label}
        </span>
        {hint ? (
          <span className="block text-sm text-remme-ink/60 dark:text-remme-inklight/60">
            {hint}
          </span>
        ) : null}
      </span>
      <input
        type="checkbox"
        role="switch"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className={cn(
          "relative h-8 w-14 appearance-none rounded-full bg-remme-sage/25 transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-remme-sage/40",
          checked && "bg-remme-sage",
        )}
      />
    </label>
  );

  return (
    <div className={cn("space-y-4", className)}>
      <Switch
        checked={theme.reduceTransparency}
        onChange={setReduceTransparency}
        label="Reduce transparency"
        hint="Swap frosted glass for solid, easier-to-read surfaces"
      />
      <Switch
        checked={theme.largeText}
        onChange={setLargeText}
        label="Larger text"
        hint="Increase text size everywhere"
      />
      <Switch
        checked={theme.highContrast}
        onChange={setHighContrast}
        label="High contrast"
        hint="Stronger contrast between text and background"
      />
    </div>
  );
}

export { A11yProvider, A11ySettings, useA11y };