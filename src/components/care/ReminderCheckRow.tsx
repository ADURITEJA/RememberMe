"use client";

/**
 * ReminderCheckRow — a single large reminder row with a gentle check-to-complete.
 * Used on Home ("next 3") and the Reminders page.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Bell } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ReminderRowData {
  id: string;
  title: string;
  description?: string | null;
  time: string;
  icon?: string | null;
  category?: string | null;
  completed: boolean;
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  Medication: "💊",
  Meals: "🍽️",
  Appointments: "📅",
  Activities: "🚶",
  General: "⭐",
};

async function toggleReminder(id: string, completed: boolean): Promise<boolean> {
  try {
    const res = await fetch(`/api/reminders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export default function ReminderCheckRow({
  reminder,
  size = "default",
}: {
  reminder: ReminderRowData;
  size?: "default" | "large";
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  const timeLabel = reminder.time ? reminder.time : "";
  const emoji = CATEGORY_ICONS[reminder.category ?? "General"] ?? "⭐";

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (busy) return;
    setBusy(true);
    setFailed(false);
    const ok = await toggleReminder(reminder.id, !reminder.completed);
    if (!ok) {
      setFailed(true);
      setBusy(false);
      return;
    }
    router.refresh();
  };

  return (
    <div
      className={cn(
        "glass-card flex w-full items-center justify-between gap-3 rounded-2xl p-4 min-touch",
        size === "large" && "p-5",
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <span
          className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-remme-amber/15 text-2xl"
          aria-hidden
        >
          {reminder.icon || emoji}
        </span>
        <div className="flex min-w-0 flex-col">
          <p
            className={cn(
              "truncate font-semibold text-remme-ink",
              reminder.completed && "opacity-60",
            )}
          >
            {reminder.title}
          </p>
          {reminder.time ? (
            <p className="text-sm text-remme-ink/55">{timeLabel}</p>
          ) : null}
        </div>
      </div>

      <button
        type="button"
        role="checkbox"
        aria-checked={reminder.completed}
        aria-label={
          reminder.completed
            ? `Mark "${reminder.title}" as not done`
            : `Mark "${reminder.title}" as done`
        }
        onClick={handleToggle}
        disabled={busy}
        className={cn(
          "flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-[3px] transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-remme-sage/40 min-touch",
          reminder.completed
            ? "border-remme-sage bg-remme-sage text-white"
            : "border-remme-sage/30 bg-white/60 text-transparent hover:border-remme-sage",
          busy && "pointer-events-none opacity-50",
        )}
      >
        <Check aria-hidden className="h-7 w-7" strokeWidth={3} />
      </button>

      {failed ? (
        <p className="text-xs font-medium text-remme-status-emergency" role="alert">
          Couldn&apos;t update — try again.
        </p>
      ) : null}
    </div>
  );
}