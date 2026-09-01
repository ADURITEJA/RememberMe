"use client";

import * as React from "react";
import { SessionProvider } from "next-auth/react";

/**
 * Thin client wrapper around next-auth's SessionProvider.
 * Used in the root layout so client components can read the session,
 * and wrapped here to give future providers a single insertion point.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}