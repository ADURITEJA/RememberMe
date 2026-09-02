import * as React from "react";

/**
 * Shared layout for public auth pages (login / signup / role).
 * Apple Liquid Glass centred card on a clean backdrop.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10 bg-white">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <span className="inline-flex h-14 w-14 items-center justify-center rounded-[980px] bg-[#0071e3] text-2xl font-bold text-white shadow-sm">
            R
          </span>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-[#1d1d1f]">
            Remme
          </h1>
          <p className="mt-1 text-lg text-[#86868b]">
            Remember. Connect. Care.
          </p>
        </div>
        <div className="rounded-[20px] bg-white/72 backdrop-blur-[20px] saturate-[180%] border border-[rgba(0,0,0,0.08)] p-6 sm:p-8 shadow-[0_2px_12px_0_rgba(0,0,0,0.06),0_8px_32px_0_rgba(0,0,0,0.04)]">
          {children}
        </div>
      </div>
    </main>
  );
}
