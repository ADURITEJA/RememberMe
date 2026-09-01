"use client";

import { useEffect } from "react";
import { CloudOff, RefreshCw, HeartHandshake } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Reliable Care Mode error boundary — friendly copy + a retry button.
 * Because the patient is the person who sees this, the tone is calm and
 * reassuring, never alarming.
 */
export default function CareError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Care Mode] Unhandled error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-remme-status-attention/10 text-remme-status-attention">
        <CloudOff aria-hidden className="h-10 w-10" />
      </div>
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold text-remme-ink">
          A small connection hiccup
        </h1>
        <p className="max-w-md text-lg leading-relaxed text-remme-ink/70">
          Everything is safe and nothing is lost. Sometimes the connection just
          needs a moment — let&apos;s give it another try.
        </p>
      </div>
      <div className="flex flex-col items-center gap-3">
        <Button
          variant="sage"
          size="lg"
          onClick={() => reset()}
          className="gap-2 min-touch"
        >
          <RefreshCw aria-hidden className="h-5 w-5" />
          Try again
        </Button>
        <p className="inline-flex items-center gap-2 text-sm text-remme-ink/50">
          <HeartHandshake aria-hidden className="h-4 w-4" />
          Remme is right here with you
        </p>
      </div>
    </div>
  );
}