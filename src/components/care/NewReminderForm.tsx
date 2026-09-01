"use client";

/**
 * NewReminderForm — a friendly, oversized "New reminder" form.
 * Fields: title, time, repeat daily, category. Saving without leaving the page.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { key: "Medication", label: "💊 Medication" },
  { key: "Meals", label: "🍽️ Meals" },
  { key: "Appointments", label: "📅 Appointments" },
  { key: "Activities", label: "🚶 Activities" },
  { key: "General", label: "✨ General" },
];

export default function NewReminderForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("09:00");
  const [repeatDaily, setRepeatDaily] = useState(true);
  const [category, setCategory] = useState("General");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch("/api/reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          time,
          recurrence: repeatDaily ? "DAILY" : "ONCE",
          category,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Sorry, we couldn't save that. Please try again.");
        setBusy(false);
        return;
      }
      setTitle("");
      setTime("09:00");
      setRepeatDaily(true);
      setCategory("General");
      setSuccess(true);
      setBusy(false);
      router.refresh();
      window.setTimeout(() => setSuccess(false), 4000);
    } catch {
      setError("Sorry, we couldn't reach the server. Please try again.");
      setBusy(false);
    }
  };

  const labelClass = "text-lg font-semibold text-remme-ink";
  const inputClass =
    "w-full min-h-14 rounded-2xl border-2 border-remme-sage/15 bg-white/80 px-5 py-3 text-xl text-remme-ink placeholder:text-remme-ink/40 focus:border-remme-sage focus:outline-none focus:ring-4 focus:ring-remme-sage/25";

  return (
    <form
      onSubmit={submit}
      className="glass-card flex flex-col gap-5 p-6 sm:p-7"
      aria-label="Add a new reminder"
    >
      <h3 className="flex items-center gap-2 text-2xl font-semibold text-remme-ink">
        <Bell aria-hidden className="h-6 w-6 text-remme-sage" />
        New reminder
      </h3>

      <div className="flex flex-col gap-2">
        <label htmlFor="reminder-title" className={labelClass}>
          What should we remind you of?
        </label>
        <input
          id="reminder-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Time for a glass of water"
          required
          autoComplete="off"
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-6">
        <div className="flex flex-col gap-2 sm:flex-1">
          <label htmlFor="reminder-time" className={labelClass}>
            What time?
          </label>
          <input
            id="reminder-time"
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            required
            className={inputClass}
          />
        </div>

        <div className="flex flex-col gap-2 sm:flex-1">
          <span className={labelClass}>What kind?</span>
          <select
            id="reminder-category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={inputClass}
            aria-label="Reminder category"
          >
            {CATEGORIES.map((c) => (
              <option key={c.key} value={c.key}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <label className="flex min-h-14 cursor-pointer items-center gap-3 rounded-2xl bg-remme-sage/8 px-4 py-3">
        <input
          type="checkbox"
          checked={repeatDaily}
          onChange={(e) => setRepeatDaily(e.target.checked)}
          className="h-7 w-7 rounded-md accent-remme-sage"
        />
        <span className="text-lg text-remme-ink">Remind me every day</span>
      </label>

      {error ? (
        <p role="alert" className="rounded-xl bg-remme-status-emergency/10 px-4 py-3 text-base font-medium text-remme-status-emergency">
          {error}
        </p>
      ) : null}

      <Button type="submit" variant="sage" size="xl" isLoading={busy} className="w-full gap-2">
        {success && <CheckCircle2 aria-hidden className="h-6 w-6" />}
        {success ? "Saved — well done!" : "Save my reminder"}
      </Button>
    </form>
  );
}