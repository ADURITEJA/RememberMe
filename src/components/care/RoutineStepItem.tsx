"use client";

import { useState, useEffect } from "react";
import { CheckCircle2 as CC2, Circle as C } from "lucide-react";
import { cn } from "@/lib/utils";

const TODAY_KEY = (profileId: string) => `routine-check-${profileId}-${new Date().toISOString().slice(0, 10)}`;

interface RoutineStepItemProps {
  step: { id: string; title: string; timeEst: string | null; order: number };
  profileId: string;
}

export function RoutineStepItem({ step, profileId }: RoutineStepItemProps) {
  const [done, setDone] = useState(false);

  const storageKey = `${TODAY_KEY(profileId)}-${step.id}`;

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored === "true") setDone(true);
    } catch {}
  }, [storageKey]);

  const toggle = () => {
    const next = !done;
    setDone(next);
    try {
      localStorage.setItem(storageKey, String(next));
    } catch {}
  };

  return (
    <li className="glass-card flex items-center gap-4 p-4 min-touch" onClick={toggle}>
      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 transition-colors",
          done
            ? "bg-remme-sage border-remme-sage text-white"
            : "border-remme-sage/20 text-remme-ink/40 hover:border-remme-sage/50",
        )}
        aria-hidden
      >
        {done ? <CC2 className="h-6 w-6" /> : <C className="h-6 w-6" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn("text-lg font-medium leading-snug truncate", done ? "text-remme-ink/50 line-through" : "text-remme-ink")}>
          {step.title}
        </p>
        {step.timeEst && (
          <p className="text-base text-remme-ink/50">{step.timeEst}</p>
        )}
      </div>
      <span className={cn("text-sm font-medium", done ? "text-remme-sage" : "text-remme-ink/40")}>
        {done ? "Done" : "Tap to mark"}
      </span>
    </li>
  );
}