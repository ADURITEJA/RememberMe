import * as React from "react";

/**
 * Shared layout for public auth pages (login / signup / role).
 * Gives a calm, centred glass card on the warm Remme backdrop.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <span className="inline-flex h-14 w-14 items-center justify-center rounded-3xl bg-remme-sage text-2xl font-black text-white shadow-glass">
            R
          </span>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-remme-ink dark:text-remme-inklight">
            Remme
          </h1>
          <p className="mt-1 text-lg text-remme-ink/60 dark:text-remme-inklight/60">
            Remember. Connect. Care.
          </p>
        </div>
        <div className="glass-panel p-6 sm:p-8">{children}</div>
      </div>
    </main>
  );
}