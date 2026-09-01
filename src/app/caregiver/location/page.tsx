import * as React from "react";
import { format, differenceInCalendarDays } from "date-fns";
import { MapPin, Target, Zap, CircleAlert, CheckCircle2 } from "lucide-react";
import { requireActivePatient } from "@/components/caregiver/caregiver-db";
import { prisma } from "@/lib/prisma";
import { isInsideZone } from "@/lib/geo";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MOCK_MAP } from "@/components/caregiver/MOCK_MAP";
import { LivePingToggle } from "@/components/caregiver/LivePingToggle";
import { ZoneToggle } from "@/components/caregiver/ZoneToggle";

function relativeLabel(date: Date) {
  const days = differenceInCalendarDays(new Date(), date);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}

function zoneStatusBadge(status: "INSIDE" | "OUTSIDE" | "UNKNOWN") {
  if (status === "INSIDE") return <Badge variant="sage">Inside</Badge>;
  if (status === "OUTSIDE") return <Badge variant="amber">Outside</Badge>;
  return <Badge variant="ink">Unknown</Badge>;
}

export default async function CaregiverLocationPage({
  searchParams,
}: {
  searchParams: Promise<{ patient?: string | string[] }>;
}) {
  const { patient } = await searchParams;
  const { patient: active } = await requireActivePatient(patient);

  const [lastPing, zones, events] = await Promise.all([
    prisma.locationPing.findFirst({
      where: { patientId: active.id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.safetyZone.findMany({ where: { patientId: active.id }, orderBy: { name: "asc" } }),
    prisma.zoneEvent.findMany({
      where: { zone: { patientId: active.id } },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { zone: { select: { id: true, name: true } } },
    }),
  ]);

  const point = lastPing ? { lat: lastPing.lat, lng: lastPing.lng } : null;
  const annotatedZones = zones.map((z) => ({
    id: z.id,
    name: z.name,
    lat: z.lat,
    lng: z.lng,
    radius: z.radius,
    isActive: z.isActive,
    status: isInsideZone(point, z) as "INSIDE" | "OUTSIDE" | "UNKNOWN",
  }));
  const inAnyZone = annotatedZones.some((z) => z.status === "INSIDE");
  const data = {
    lastPing: lastPing ? { lat: lastPing.lat, lng: lastPing.lng, createdAt: lastPing.createdAt.toISOString() } : null,
    zones: annotatedZones,
    events: events.map((e) => ({ id: e.id, type: e.type, zoneName: e.zone?.name ?? "Unknown", createdAt: e.createdAt.toISOString() })),
    inAnyZone,
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <section className="flex flex-col gap-2">
        <h2 className="text-2xl font-semibold tracking-tight text-remme-ink dark:text-remme-inklight">
          Location & safety for {active.name}
        </h2>
        <p className="text-lg text-remme-ink/65 dark:text-remme-inklight/65">
          See the latest location, safety zones, and recent zone events. Demo ping simulates
          a device sending updates — not real tracking.
        </p>
      </section>

      {/* Last ping + zone summary */}
      <section className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Target aria-hidden className="h-5 w-5 text-remme-sage" />
              Last known location
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.lastPing ? (
              <div className="flex flex-col gap-4">
                <div className="aspect-square rounded-2xl overflow-hidden bg-remme-sage/10">
                  <MOCK_MAP
                    points={[
                      { lat: data.lastPing.lat, lng: data.lastPing.lng, label: "Current location" },
                      ...data.zones.map((z) => ({
                        lat: z.lat,
                        lng: z.lng,
                        label: z.name,
                        radius: z.radius,
                        isZoneCenter: true,
                      })),
                    ]}
                  />
                </div>
                <div className="flex flex-col gap-2 rounded-2xl bg-white/80 p-4 dark:bg-remme-charcoal/50">
                  <div className="flex items-center justify-between">
                    <span className="text-base text-remme-ink/60">Latitude</span>
                    <span className="font-mono text-base font-medium text-remme-ink">
                      {data.lastPing.lat.toFixed(6)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-base text-remme-ink/60">Longitude</span>
                    <span className="font-mono text-base font-medium text-remme-ink">
                      {data.lastPing.lng.toFixed(6)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-base text-remme-ink/60">Updated</span>
                    <span className="font-medium text-remme-ink">
                      {relativeLabel(new Date(data.lastPing.createdAt))} at{" "}
                      {format(new Date(data.lastPing.createdAt), "HH:mm")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 rounded-xl bg-remme-sage/10 px-3 py-2">
                    {data.inAnyZone ? (
                      <CheckCircle2 aria-hidden className="h-5 w-5 text-remme-sage" />
                    ) : (
                      <CircleAlert aria-hidden className="h-5 w-5 text-remme-amber" />
                    )}
                    <span className="text-base font-medium text-remme-ink">
                      {data.inAnyZone ? "Inside a safe zone" : "Not inside any safe zone"}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-3 p-8 text-center">
                <MapPin aria-hidden className="h-12 w-12 text-remme-ink/30" />
                <p className="text-lg text-remme-ink/60">No location data yet.</p>
                <p className="text-sm text-remme-ink/50">
                  The patient&apos;s device hasn&apos;t sent a ping. Use the demo toggle below to simulate one.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Safety zones */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-xl">
              <MapPin aria-hidden className="h-5 w-5 text-remme-sage" />
              Safety zones
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.zones.length === 0 ? (
              <p className="text-lg text-remme-ink/55">No safety zones configured.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {data.zones.map((zone) => (
                  <div
                    key={zone.id}
                    className="flex items-center justify-between gap-4 rounded-2xl border border-remme-sage/10 bg-white/50 p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-10 w-10 rounded-xl flex items-center justify-center ${
                          zone.status === "INSIDE"
                            ? "bg-remme-sage text-white"
                            : zone.status === "OUTSIDE"
                            ? "bg-remme-amber text-white"
                            : "bg-remme-ink/10 text-remme-ink"
                        }`}
                      >
                        <Zap aria-hidden className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-lg font-medium text-remme-ink">{zone.name}</p>
                        <p className="text-sm text-remme-ink/50">
                          {zone.radius}m radius · {zone.isActive ? "Active" : "Inactive"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {zoneStatusBadge(zone.status)}
                      <ZoneToggle zoneId={zone.id} isActive={zone.isActive} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Live ping toggle */}
      <section>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Zap aria-hidden className="h-5 w-5 text-remme-amber" />
              Demo live ping
            </CardTitle>
          </CardHeader>
          <CardContent>
            <LivePingToggle patientId={active.id} />
            <p className="mt-3 text-sm text-remme-ink/55">
              When enabled, sends a simulated location ping every ~5 seconds from the Home zone.
              This is a <strong>demo simulation</strong> — not real device tracking.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Zone events feed */}
      <section>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-xl">
              <CircleAlert aria-hidden className="h-5 w-5 text-remme-status-attention" />
              Recent zone events
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.events.length === 0 ? (
              <p className="text-lg text-remme-ink/55">No zone events recorded yet.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {data.events.map((event) => (
                  <li
                    key={event.id}
                    className="flex items-center gap-3 rounded-2xl border border-remme-status-attention/10 bg-white/50 px-4 py-3"
                  >
                    {event.type === "ENTERED" ? (
                      <CheckCircle2 aria-hidden className="h-5 w-5 shrink-0 text-remme-sage" />
                    ) : (
                      <CircleAlert aria-hidden className="h-5 w-5 shrink-0 text-remme-status-attention" />
                    )}
                    <div className="flex-1">
                      <p className="text-lg text-remme-ink">
                        {event.type === "ENTERED" ? "Entered" : "Exited"} <strong>{event.zoneName}</strong>
                      </p>
                      <p className="text-sm text-remme-ink/50">{relativeLabel(new Date(event.createdAt))}</p>
                    </div>
                    <Badge variant={event.type === "ENTERED" ? "sage" : "attention"}>
                      {event.type}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}