"use client";

import { useState } from "react";
import { Check, SkipForward, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MedicationRow {
  id: string;
  name: string;
  dosage: string;
  instructions: string | null;
  imageUrl: string | null;
  times: string;
  log: { id: string; status: string; takenAt: string | null } | null;
}

function formatTime(times: string): string {
  const parts = times.split(",").map((t) => t.trim());
  return parts
    .map((t) => {
      const [h, m] = t.split(":").map(Number);
      const ampm = h >= 12 ? "PM" : "AM";
      const hour = h % 12 || 12;
      return `${hour}:${m.toString().padStart(2, "0")} ${ampm}`;
    })
    .join(", ");
}

/**
 * Client component for a single medication pill card.
 * Shows pill info + "I took it" / "Skip" buttons.
 * Optimistic UI: immediately shows completed state, then refreshes server data.
 */
export default function MedicationPillCard({
  medication,
  size = "default",
}: {
  medication: MedicationRow;
  size?: "default" | "large";
}) {
  const [log, setLog] = useState(medication.log);
  const [busy, setBusy] = useState(false);

  const isCompleted = log?.status === "TAKEN" || log?.status === "SKIPPED";
  const isTaken = log?.status === "TAKEN";
  const isSkipped = log?.status === "SKIPPED";

  const handleLog = async (status: "TAKEN" | "SKIPPED") => {
    if (busy || isCompleted) return;
    setBusy(true);
    // Optimistic UI
    setLog({ id: "optimistic", status, takenAt: new Date().toISOString() });
    try {
      const res = await fetch("/api/medications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ medicationId: medication.id, status }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Could not log dose");
      setLog(data.log ?? { id: "done", status, takenAt: new Date().toISOString() });
    } catch {
      // Revert optimistic update on failure
      setLog(medication.log);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className={cn(
        "glass-card flex flex-col gap-3 p-4 sm:p-5 transition-all",
        isCompleted && "opacity-80",
        isTaken && "border-l-4 border-remme-sage",
        isSkipped && "border-l-4 border-remme-amber",
      )}
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-2xl",
            isTaken
              ? "bg-remme-sage/15"
              : isSkipped
                ? "bg-remme-amber/15"
                : "bg-remme-sage/10",
          )}
        >
          {isTaken ? "✅" : isSkipped ? "⏭️" : "💊"}
        </span>
        <div className="flex-1 min-w-0">
          <p className={cn(
            "text-xl font-semibold leading-tight text-remme-ink",
            isCompleted && "line-through decoration-remme-ink/30",
          )}>
            {medication.name}
          </p>
          <p className="text-base text-remme-ink/60">{medication.dosage}</p>
          {medication.instructions && (
            <p className="text-sm text-remme-ink/50 italic">{medication.instructions}</p>
          )}
        </div>
      </div>

      {/* Time */}
      <div className="flex items-center gap-2 text-base text-remme-ink/55">
        <Clock aria-hidden className="h-4 w-4" />
        {formatTime(medication.times)}
      </div>

      {/* Status / Actions */}
      {isCompleted ? (
        <div
          className={cn(
            "flex items-center gap-2 rounded-xl px-4 py-2.5 text-lg font-medium",
            isTaken
              ? "bg-remme-sage/10 text-remme-sage-deep"
              : "bg-remme-amber/10 text-remme-amber",
          )}
        >
          {isTaken ? (
            <>
              <Check aria-hidden className="h-5 w-5" />
              Taken
            </>
          ) : (
            <>
              <SkipForward aria-hidden className="h-5 w-5" />
              Skipped
            </>
          )}
        </div>
      ) : (
        <div className="flex gap-3">
          <button
            onClick={() => handleLog("TAKEN")}
            disabled={busy}
            className={cn(
              "flex min-h-12 min-w-[7rem] flex-1 items-center justify-center gap-2 rounded-xl bg-remme-sage text-white text-lg font-semibold transition-all min-touch",
              busy && "opacity-50",
            )}
          >
            <Check aria-hidden className="h-5 w-5" /> I took it
          </button>
          <button
            onClick={() => handleLog("SKIPPED")}
            disabled={busy}
            className={cn(
              "flex min-h-12 min-w-[6rem] flex-1 items-center justify-center gap-2 rounded-xl border border-remme-ink/15 bg-remme-offwhite text-lg font-medium text-remme-ink/70 transition-all min-touch",
              busy && "opacity-50",
            )}
          >
            <SkipForward aria-hidden className="h-5 w-5" /> Skip
          </button>
        </div>
      )}
    </div>
  );
}
