"use client";

import { useEffect } from "react";
import { HeartHandshake, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Remme error:", error);
  }, [error]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 text-center">
      <div className="flex flex-col items-center gap-6 max-w-md">
        <div className="flex h-24 w-24 items-center justify-center rounded-[24px] bg-[#ff3b30]/10 text-[#ff3b30]">
          <HeartHandshake aria-hidden className="h-12 w-12" strokeWidth={1.5} />
        </div>

        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-bold text-[#1d1d1f] tracking-tight">Something went wrong</h1>
          <p className="text-lg leading-relaxed text-[#86868b]">
            We hit a little bump. Don&apos;t worry — everything important is still safe.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            size="lg"
            className="min-touch gap-2"
            onClick={reset}
          >
            <RefreshCw aria-hidden className="h-5 w-5" strokeWidth={1.5} />
            Try again
          </Button>
          <a href="/home">
            <Button variant="outline" size="lg" className="min-touch gap-2">
              <Home aria-hidden className="h-5 w-5" strokeWidth={1.5} />
              Go home
            </Button>
          </a>
        </div>

        {error.digest && (
          <p className="text-sm text-[#86868b]/60">
            Error ID: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}
