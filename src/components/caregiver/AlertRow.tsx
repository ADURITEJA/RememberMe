"use client";

import * as React from "react";
import { formatDistanceToNow } from "date-fns";
import { CheckCircle2, CircleAlert } from "lucide-react";
import { alertTone } from "@/components/caregiver/StatusBadge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface AlertRowData {
  id: string;
  type: string;
  message: string;
  isRead: boolean;
  createdAt: string; // ISO
}

function typeLabel(type: string) {
  return type.replace(/_/g, " ").toLowerCase();
}

export function AlertRow({
  alert,
  onUpdate,
  disabled,
}: {
  alert: AlertRowData;
  onUpdate?: (id: string, isRead: boolean) => void;
  disabled?: boolean;
}) {
  const [busy, setBusy] = React.useState(false);
  const tone = alertTone(alert.type);

  const handleMarkHandled = async () => {
    setBusy(true);
    try {
      const res = await fetch(`/api/alerts/${alert.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isRead: true }),
      });
      if (res.ok) onUpdate?.(alert.id, true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <li
      className={cn(
        "flex items-start gap-3 rounded-2xl border px-4 py-3",
        alert.isRead
          ? "border-remme-sage/10 bg-white/40"
          : "border-remme-sage/20 bg-white/70",
      )}
    >
      <span aria-hidden className="mt-0.5 shrink-0">
        {alert.isRead ? (
          <CheckCircle2 className="h-6 w-6 text-remme-sage" />
        ) : (
          <CircleAlert
            className={cn(
              "h-6 w-6",
              tone === "emergency" && "text-remme-status-emergency",
              tone === "attention" && "text-remme-status-attention",
              tone === "sage" && "text-remme-sage",
            )}
          />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-lg text-remme-ink dark:text-remme-inklight">
          {alert.message}
        </p>
        <p className="mt-0.5 text-sm text-remme-ink/55 dark:text-remme-inklight/55">
          <span className="capitalize">{typeLabel(alert.type)}</span>
          {" · "}
          <time dateTime={alert.createdAt} title={new Date(alert.createdAt).toString()}>
            {formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true })}
          </time>
        </p>
      </div>
      {!alert.isRead && (
        <Button
          type="button"
          variant="glass"
          size="sm"
          onClick={handleMarkHandled}
          disabled={busy || disabled}
          className="shrink-0"
        >
          {busy ? "Saving…" : "Mark handled"}
        </Button>
      )}
    </li>
  );
}
