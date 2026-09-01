"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import {
  Pill,
  Siren,
  MapPin,
  Bell,
  CheckCircle2,
  CircleAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface NotificationData {
  id: string;
  title: string;
  body: string;
  type: string;
  isRead: boolean;
  createdAt: string; // ISO
}

function typeIcon(type: string) {
  switch (type) {
    case "MISSED_MEDICATION":
      return <Pill aria-hidden className="h-6 w-6 text-remme-status-attention" />;
    case "SOS":
      return <Siren aria-hidden className="h-6 w-6 text-remme-status-emergency" />;
    case "ZONE_EXIT":
      return <MapPin aria-hidden className="h-6 w-6 text-remme-status-attention" />;
    default:
      return <Bell aria-hidden className="h-6 w-6 text-remme-sage" />;
  }
}

export default function NotificationRow({
  notification,
}: {
  notification: NotificationData;
}) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);

  const handleMarkRead = async () => {
    setBusy(true);
    try {
      const res = await fetch(`/api/notifications/${notification.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isRead: true }),
      });
      if (res.ok) router.refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <li
      className={cn(
        "glass-card flex items-start gap-4 p-5 transition-all",
        notification.isRead
          ? "opacity-70"
          : "border-l-4 border-l-remme-sage bg-white/60",
      )}
    >
      <span
        aria-hidden
        className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-remme-sage/10"
      >
        {typeIcon(notification.type)}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-lg font-semibold text-remme-ink">
          {notification.title}
        </p>
        <p className="mt-1 text-base leading-relaxed text-remme-ink/70">
          {notification.body}
        </p>
        <p className="mt-2 text-sm text-remme-ink/45">
          <time
            dateTime={notification.createdAt}
            title={new Date(notification.createdAt).toString()}
          >
            {formatDistanceToNow(new Date(notification.createdAt), {
              addSuffix: true,
            })}
          </time>
        </p>
      </div>
      {!notification.isRead && (
        <Button
          type="button"
          variant="glass"
          size="sm"
          onClick={handleMarkRead}
          disabled={busy}
          className="shrink-0"
        >
          {busy ? (
            "Saving…"
          ) : (
            <>
              <CheckCircle2 aria-hidden className="mr-1 h-4 w-4" />
              Read
            </>
          )}
        </Button>
      )}
    </li>
  );
}
