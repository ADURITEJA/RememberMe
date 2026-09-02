"use client";

import { Smile } from "lucide-react";

interface MoodEntry {
  id: string;
  mood: string;
  note: string | null;
  createdAt: string;
}

const MOOD_MAP: Record<string, { emoji: string; color: string }> = {
  Happy: { emoji: "😊", color: "bg-amber-500/15 text-amber-700 dark:text-amber-400" },
  Fine: { emoji: "🙂", color: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400" },
  Sad: { emoji: "😢", color: "bg-blue-500/15 text-blue-700 dark:text-blue-400" },
  Worried: { emoji: "😟", color: "bg-orange-500/15 text-orange-700 dark:text-orange-400" },
  Confused: { emoji: "😕", color: "bg-purple-500/15 text-purple-700 dark:text-purple-400" },
};

function relativeTime(iso: string) {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diffMin = Math.floor((now - then) / 60000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay === 1) return "Yesterday";
  return `${diffDay}d ago`;
}

function dayLabel(iso: string) {
  const now = new Date();
  const d = new Date(iso);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);

  if (d >= startOfToday) return "Today";
  if (d >= startOfYesterday) return "Yesterday";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function groupByDay(entries: MoodEntry[]) {
  const groups: { label: string; items: MoodEntry[] }[] = [];
  let currentLabel = "";
  for (const e of entries) {
    const label = dayLabel(e.createdAt);
    if (label !== currentLabel) {
      currentLabel = label;
      groups.push({ label, items: [] });
    }
    groups[groups.length - 1].items.push(e);
  }
  return groups;
}

export default function MoodHistory({ entries }: { entries: MoodEntry[] }) {
  if (entries.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-amber-400/40 bg-amber-50/30 p-8 text-center dark:border-amber-500/30 dark:bg-amber-950/20">
        <Smile aria-hidden className="mx-auto mb-3 h-10 w-10 text-amber-500/50" />
        <p className="text-remme-ink/60 dark:text-remme-inklight/60">
          No mood entries yet. Check-ins will appear here.
        </p>
      </div>
    );
  }

  const groups = groupByDay(entries);

  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <div key={group.label}>
          <h3 className="mb-3 text-sm font-medium text-remme-ink/50 dark:text-remme-inklight/50">
            {group.label}
          </h3>
          <div className="space-y-2">
            {group.items.map((entry) => {
              const mood = MOOD_MAP[entry.mood] ?? { emoji: "🙂", color: "bg-slate-500/15 text-slate-700 dark:text-slate-400" };
              return (
                <div
                  key={entry.id}
                  className="glass-card flex items-center gap-4 rounded-3xl p-4"
                >
                  <span className="text-3xl" aria-hidden>{mood.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${mood.color}`}>
                        {entry.mood}
                      </span>
                      <span className="text-xs text-remme-ink/40 dark:text-remme-inklight/40">
                        {relativeTime(entry.createdAt)}
                      </span>
                    </div>
                    {entry.note && (
                      <p className="mt-1 text-sm text-remme-ink/60 dark:text-remme-inklight/60">
                        {entry.note}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
