"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, CircleAlert, CheckCheck, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { differenceInCalendarDays, format } from "date-fns";

type AlertRow = {
  id: string;
  type: string;
  message: string;
  isRead: boolean;
  createdAt: string;
};

function timeLabel(iso: string) {
  const date = new Date(iso);
  const days = differenceInCalendarDays(new Date(), date);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  try {
    return format(date, "MMM d");
  } catch {
    return iso.slice(0, 10);
  }
}

export default function AlertsPanel({
  alerts,
  patientId,
}: {
  alerts: AlertRow[];
  patientId: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const markRead = async (id: string, isRead: boolean) => {
    setBusy(id);
    setError(null);
    const res = await fetch(`/api/alerts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isRead }),
    });
    setBusy(null);
    if (!res.ok) {
      setError("Couldn't update that alert.");
      return;
    }
    router.refresh();
  };

  const dismiss = async (id: string) => {
    setBusy(id);
    setError(null);
    const res = await fetch(`/api/alerts/${id}`, { method: "DELETE" });
    setBusy(null);
    if (!res.ok) {
      setError("Couldn't dismiss that alert.");
      return;
    }
    router.refresh();
  };

  const markAllRead = async () => {
    setError(null);
    const unread = alerts.filter((a) => !a.isRead);
    await Promise.all(
      unread.map((a) =>
        fetch(`/api/alerts/${a.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isRead: true }),
        }),
      ),
    );
    router.refresh();
  };

  const unreadCount = alerts.filter((a) => !a.isRead).length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant={unreadCount > 0 ? "attention" : "sage"}>
            {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
          </Badge>
          <span className="text-lg text-remme-ink/60">{alerts.length} total</span>
        </div>
        {unreadCount > 0 ? (
          <Button type="button" size="sm" variant="outline" onClick={markAllRead}>
            <CheckCheck aria-hidden className="mr-1.5 h-4 w-4" />
            Mark all read
          </Button>
        ) : null}
      </div>

      {error ? (
        <p role="alert" className="rounded-2xl bg-remme-status-attention/10 px-4 py-3 text-base text-remme-status-attention">
          {error}
        </p>
      ) : null}

      {alerts.length === 0 ? (
        <div className="flex min-h-[14rem] flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-remme-sage/30 bg-white/40 p-10 text-center">
          <CheckCircle2 aria-hidden className="h-10 w-10 text-remme-sage" />
          <p className="text-lg text-remme-ink/55">
            No alerts — all quiet for this patient. <span aria-hidden>{patientId ? "" : ""}</span>
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3" aria-label="Alerts">
          {alerts.map((a) => (
            <li
              key={a.id}
              className={`flex flex-col gap-3 rounded-2xl border px-5 py-4 sm:flex-row sm:items-center sm:justify-between ${
                a.isRead
                  ? "border-remme-sage/10 bg-white/40"
                  : "border-remme-status-attention/25 bg-remme-status-attention/5"
              }`}
            >
              <div className="flex items-start gap-3">
                {a.isRead ? (
                  <CheckCircle2 aria-hidden className="mt-1 h-5 w-5 shrink-0 text-remme-sage" />
                ) : (
                  <CircleAlert aria-hidden className="mt-1 h-5 w-5 shrink-0 text-remme-status-attention" />
                )}
                <div>
                  <p className="text-lg text-remme-ink">{a.message}</p>
                  <p className="mt-0.5 text-sm text-remme-ink/50">
                    {a.type.replace(/_/g, " ").toLowerCase()} · {timeLabel(a.createdAt)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!a.isRead ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={busy === a.id}
                    onClick={() => markRead(a.id, true)}
                  >
                    <CheckCheck aria-hidden className="mr-1 h-4 w-4" />
                    Read
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={busy === a.id}
                    onClick={() => markRead(a.id, false)}
                  >
                    Mark unread
                  </Button>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={busy === a.id}
                  onClick={() => dismiss(a.id)}
                  aria-label="Dismiss alert"
                >
                  <Trash2 aria-hidden className="h-4 w-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
