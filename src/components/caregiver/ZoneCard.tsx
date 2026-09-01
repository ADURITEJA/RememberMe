"use client";

import * as React from "react";
import { Home, MapPin, Clock, CircleOff } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/caregiver/StatusBadge";
import { cn } from "@/lib/utils";

export interface ZoneCardData {
  id: string;
  name: string;
  lat: number;
  lng: number;
  radius: number;
  isActive: boolean;
  activeHours?: string | null;
  // Derived server-side status for the last known ping.
  status?: "INSIDE" | "OUTSIDE" | "INACTIVE" | "NO_DEVICE_LOCATION";
}

function parseActiveHours(raw: string | null | undefined): string | null {
  if (!raw) return null;
  try {
    const arr = JSON.parse(raw) as { start: string; end: string }[];
    if (!Array.isArray(arr)) return null;
    return arr.map((h) => `${h.start}–${h.end}`).join(", ");
  } catch {
    return null;
  }
}

export function ZoneCard({
  zone,
  onChange,
}: {
  zone: ZoneCardData;
  onChange?: (id: string, isActive: boolean) => void;
}) {
  const [busy, setBusy] = React.useState(false);
  const hours = parseActiveHours(zone.activeHours);

  const toggle = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/location", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ zoneId: zone.id, isActive: !zone.isActive }),
      });
      if (res.ok) onChange?.(zone.id, !zone.isActive);
    } finally {
      setBusy(false);
    }
  };

  const inactive = !zone.isActive;
  const inside = zone.status === "INSIDE";

  return (
    <Card className="p-0">
      <CardContent className="p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span
              className={cn(
                "inline-flex h-11 w-11 items-center justify-center rounded-2xl",
                inactive ? "bg-remme-ink/10 text-remme-ink/50" : "bg-remme-sage text-white",
              )}
            >
              <Home aria-hidden className="h-6 w-6" />
            </span>
            <div>
              <p className="text-lg font-semibold text-remme-ink dark:text-remme-inklight">
                {zone.name}
              </p>
              <p className="text-sm text-remme-ink/55 dark:text-remme-inklight/55">
                <MapPin aria-hidden className="mr-1 inline h-4 w-4" />
                {zone.lat.toFixed(4)}, {zone.lng.toFixed(4)} · {zone.radius}m radius
              </p>
            </div>
          </div>
          <label className="inline-flex cursor-pointer items-center gap-2">
            <span className="text-sm font-medium text-remme-ink/60">
              {inactive ? "Inactive" : "Active"}
            </span>
            <input
              type="checkbox"
              role="switch"
              checked={zone.isActive}
              onChange={toggle}
              disabled={busy}
              className={cn(
                "relative h-8 w-14 appearance-none rounded-full bg-remme-sage/25 transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-remme-sage/40",
                zone.isActive && "bg-remme-sage",
              )}
              aria-label={`Toggle ${zone.name} zone`}
            />
          </label>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          {inactive ? (
            <StatusBadge tone="muted" dot>
              Zone off
            </StatusBadge>
          ) : inside ? (
            <StatusBadge tone="sage" dot>
              Inside
            </StatusBadge>
          ) : zone.status === "INACTIVE" ? (
            <StatusBadge tone="muted" dot>
              Inactive
            </StatusBadge>
          ) : zone.status === "NO_DEVICE_LOCATION" ? (
            <StatusBadge tone="amber" dot>
              No device location
            </StatusBadge>
          ) : (
            <StatusBadge tone="attention" dot>
              Outside
            </StatusBadge>
          )}
          {hours ? (
            <span className="inline-flex items-center gap-1 text-sm text-remme-ink/55">
              <Clock aria-hidden className="h-4 w-4" />
              Active {hours}
            </span>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

export { parseActiveHours };
