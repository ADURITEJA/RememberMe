import Link from "next/link";
import { format, startOfDay, endOfDay, subDays, differenceInCalendarDays } from "date-fns";
import {
  BellRing,
  Sparkles,
  Users,
  MapPin,
  Siren,
  Pill,
  ChevronRight,
  CheckCircle2,
  Clock,
  CircleAlert,
} from "lucide-react";
import { requireActivePatient } from "@/components/caregiver/caregiver-db";
import { prisma } from "@/lib/prisma";
import { checkAllZones } from "@/lib/geo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkline } from "@/components/caregiver/Sparkline";
export const metadata = { title: "Dashboard — Remme Caregiver" };

const MOOD_VALUE: Record<string, number> = { GOOD: 3, OKAY: 2, BAD: 1, UNSPECIFIED: 1.5 };
const MOOD_LABEL: Record<string, string> = { GOOD: "Good", OKAY: "Okay", BAD: "Low" };

function relativeLabel(date: Date) {
  const days = differenceInCalendarDays(new Date(), date);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}

export default async function CaregiverDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ patient?: string | string[] }>;
}) {
  const { patient } = await searchParams;
  const { patient: active } = await requireActivePatient(patient);

  const now = new Date();
  const dayStart = startOfDay(now);
  const dayEnd = endOfDay(now);

  const [
    reminders,
    memoryCount,
    memories,
    peopleCount,
    moodCheckIns,
    alerts,
    zones,
    lastPing,
    activeMedCount,
    recentMedLogs,
    todayMedLogs,
  ] = await Promise.all([
    prisma.reminder.findMany({
      where: { patientId: active.id, isActive: true },
      orderBy: [{ time: "asc" }, { createdAt: "asc" }],
      include: {
        occurrences: {
          where: { scheduledFor: { gte: dayStart, lte: dayEnd } },
          take: 1,
          orderBy: { scheduledFor: "asc" },
        },
      },
    }),
    prisma.memory.count({ where: { patientId: active.id } }),
    prisma.memory.findMany({
      where: { patientId: active.id },
      orderBy: { date: "desc" },
      take: 3,
      include: { media: { take: 1 } },
    }),
    prisma.person.count({ where: { patientId: active.id } }),
    prisma.moodCheckIn.findMany({
      where: { patientId: active.id, createdAt: { gte: subDays(now, 7) } },
      orderBy: { createdAt: "asc" },
      take: 14,
    }),
    prisma.alert.findMany({
      where: { patientId: active.id },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.safetyZone.findMany({ where: { patientId: active.id } }),
    prisma.locationPing.findFirst({
      where: { patientId: active.id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.medication.count({ where: { patientId: active.id, isActive: true } }),
    prisma.medicationLog.findMany({
      where: {
        medication: { patientId: active.id },
        scheduledFor: { gte: subDays(now, 7), lte: dayEnd },
      },
    }),
    prisma.medicationLog.findMany({
      where: {
        medication: { patientId: active.id },
        scheduledFor: { gte: dayStart, lte: dayEnd },
      },
      include: { medication: true },
    }),
  ]);

  // Today's reminders completion status.
  const pendingToday = reminders.filter((r) => r.occurrences[0]?.status !== "COMPLETED");
  const completedToday = reminders.filter((r) => r.occurrences[0]?.status === "COMPLETED");

  // Mood sparkline: map each check-in to a 1..3 value.
  const moodSeries = moodCheckIns.map((m) => MOOD_VALUE[m.mood] ?? 1.5);
  const latestMood = moodCheckIns.length
    ? MOOD_LABEL[moodCheckIns[moodCheckIns.length - 1].mood] ?? "Unknown"
    : null;

  // Safety zone status against the last known location.
  const point = lastPing ? { lat: lastPing.lat, lng: lastPing.lng } : null;
  const zoneStatus = checkAllZones(point, zones);
  const insideSafe = zones.length > 0 && zoneStatus.inside;
  const outsideSafe = zones.length > 0 && !zoneStatus.inside && point !== null;
  const unreadAlerts = alerts.filter((a) => !a.isRead).length;

  // Medication adherence (last 7 days)
  const totalDoses = recentMedLogs.length;
  const takenDoses = recentMedLogs.filter((l) => l.status === "TAKEN").length;
  const adherencePct = totalDoses > 0 ? Math.round((takenDoses / totalDoses) * 100) : 100;

  const statCards = [
    {
      label: "Reminders today",
      value: `${completedToday.length}/${reminders.length}`,
      icon: BellRing,
      href: "/caregiver/reminders",
      tone: completedToday.length === reminders.length && reminders.length > 0,
    },
    {
      label: "Memories",
      value: memoryCount,
      icon: Sparkles,
      href: "/caregiver/memories",
      tone: memoryCount > 0,
    },
    { label: "People", value: peopleCount, icon: Users, href: "/caregiver/people", tone: peopleCount > 0 },
    {
      label: "Safety zones",
      value: zones.length,
      icon: MapPin,
      href: "/caregiver/location",
      tone: insideSafe,
    },
    {
      label: "Medications",
      value: activeMedCount > 0 ? `${adherencePct}%` : "—",
      icon: Pill,
      href: "/caregiver/medications",
      tone: adherencePct >= 80 && activeMedCount > 0,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Intro */}
      <section className="flex flex-col gap-1">
        <h2 className="text-2xl font-semibold tracking-tight text-remme-ink dark:text-remme-inklight">
          {active.name}&apos;s day at a glance
        </h2>
        <p className="text-lg text-remme-ink/65 dark:text-remme-inklight/65">
          A calm overview of reminders, memories, safety and anything that needs you.
        </p>
      </section>

      {/* Stat grid */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.label} href={stat.href}>
              <Card variant="glass-hover" className="h-full">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <span
                      className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl ${
                        stat.tone ? "bg-remme-sage text-white" : "bg-remme-sage/15 text-remme-sage-deep"
                      }`}
                    >
                      <Icon aria-hidden className="h-6 w-6" />
                    </span>
                    <ChevronRight aria-hidden className="h-5 w-5 text-remme-ink/30" />
                  </div>
                  <p className="mt-4 text-3xl font-bold text-remme-ink dark:text-remme-inklight">
                    {stat.value}
                  </p>
                  <p className="text-base text-remme-ink/60 dark:text-remme-inklight/60">{stat.label}</p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Today's Medications */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between gap-2 text-xl">
              <span className="flex items-center gap-2">
                <Pill aria-hidden className="h-5 w-5 text-remme-sage" />
                Today&apos;s medications
              </span>
              <Link
                href="/caregiver/medications"
                className="inline-flex min-h-9 items-center gap-1 rounded-xl px-2 text-base font-medium text-remme-sage-deep hover:bg-remme-sage/10"
              >
                Details <ChevronRight aria-hidden className="h-4 w-4" />
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activeMedCount === 0 ? (
              <p className="text-lg text-remme-ink/55">No active medications.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {todayMedLogs.length === 0 ? (
                  <li className="flex items-center gap-3 rounded-2xl border border-remme-sage/10 bg-white/50 px-4 py-3">
                    <Clock aria-hidden className="h-6 w-6 shrink-0 text-remme-amber" />
                    <span className="text-lg text-remme-ink">No doses scheduled yet today</span>
                  </li>
                ) : (
                  todayMedLogs.map((log) => {
                    const done = log.status === "TAKEN";
                    return (
                      <li
                        key={log.id}
                        className="flex items-center gap-3 rounded-2xl border border-remme-sage/10 bg-white/50 px-4 py-3"
                      >
                        {done ? (
                          <CheckCircle2 aria-hidden className="h-6 w-6 shrink-0 text-remme-sage" />
                        ) : (
                          <Clock aria-hidden className="h-6 w-6 shrink-0 text-remme-amber" />
                        )}
                        <span className="flex-1">
                          <span className={`block text-lg font-medium ${done ? "text-remme-ink/45 line-through" : "text-remme-ink"}`}>
                            {log.medication.name} {log.medication.dosage}
                          </span>
                          <span className="text-sm text-remme-ink/50">
                            {log.medication.times.split(",")[0]?.trim()}
                          </span>
                        </span>
                        <Badge variant={done ? "sage" : "amber"}>
                          {done ? "Taken" : log.status === "SKIPPED" ? "Skipped" : "Pending"}
                        </Badge>
                      </li>
                    );
                  })
                )}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Reminders today */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-xl">
              <BellRing aria-hidden className="h-5 w-5 text-remme-sage" />
              Today&apos;s reminders
            </CardTitle>
          </CardHeader>
          <CardContent>
            {reminders.length === 0 ? (
              <p className="text-lg text-remme-ink/55">No active reminders yet.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {reminders.slice(0, 5).map((r) => {
                  const done = r.occurrences[0]?.status === "COMPLETED";
                  return (
                    <li
                      key={r.id}
                      className="flex items-center gap-3 rounded-2xl border border-remme-sage/10 bg-white/50 px-4 py-3"
                    >
                      {done ? (
                        <CheckCircle2 aria-hidden className="h-6 w-6 shrink-0 text-remme-sage" />
                      ) : (
                        <Clock aria-hidden className="h-6 w-6 shrink-0 text-remme-amber" />
                      )}
                      <span className="flex-1">
                        <span className={`block text-lg font-medium ${done ? "text-remme-ink/45 line-through" : "text-remme-ink"}`}>
                          {r.title}
                        </span>
                        <span className="text-sm text-remme-ink/50">{r.time}</span>
                      </span>
                      <Badge variant={done ? "sage" : "amber"}>
                        {done ? "Done" : "Pending"}
                      </Badge>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Mood check-ins */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Sparkles aria-hidden className="h-5 w-5 text-remme-amber" />
              Mood check-ins
            </CardTitle>
          </CardHeader>
          <CardContent>
            {moodCheckIns.length === 0 ? (
              <p className="text-lg text-remme-ink/55">No mood check-ins in the last week.</p>
            ) : (
              <div className="flex flex-col gap-4">
                <Sparkline data={moodSeries} />
                <p className="text-base text-remme-ink/65">
                  {moodCheckIns.length} check-in{moodCheckIns.length === 1 ? "" : "s"} this week.
                  {latestMood ? (
                    <>
                      {" "}Latest: <span className="font-semibold text-remme-sage-deep">{latestMood}</span>.
                    </>
                  ) : null}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Memory previews */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between gap-2 text-xl">
              <span className="flex items-center gap-2">
                <Sparkles aria-hidden className="h-5 w-5 text-remme-sage" />
                Recent memories
              </span>
              <Link
                href="/caregiver/memories"
                className="inline-flex min-h-9 items-center gap-1 rounded-xl px-2 text-base font-medium text-remme-sage-deep hover:bg-remme-sage/10"
              >
                See all <ChevronRight aria-hidden className="h-4 w-4" />
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {memories.length === 0 ? (
              <p className="text-lg text-remme-ink/55">No memories shared yet.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {memories.map((m) => (
                  <li
                    key={m.id}
                    className="flex items-center gap-3 rounded-2xl border border-remme-sage/10 bg-white/50 px-4 py-3"
                  >
                    <span className="h-10 w-10 shrink-0 rounded-xl bg-remme-amber/20 text-xl" aria-hidden>
                      <span className="grid h-full w-full place-items-center">📸</span>
                    </span>
                    <span className="flex-1">
                      <span className="block text-lg font-medium text-remme-ink">{m.title}</span>
                      <span className="text-sm text-remme-ink/50">
                        {format(m.date, "MMMM d, yyyy")}
                        {m.location ? ` · ${m.location}` : ""}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Safety zones + alerts */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between gap-2 text-xl">
              <span className="flex items-center gap-2">
                <MapPin aria-hidden className="h-5 w-5 text-remme-sage" />
                Safety
              </span>
              <Link
                href="/caregiver/location"
                className="inline-flex min-h-9 items-center gap-1 rounded-xl px-2 text-base font-medium text-remme-sage-deep hover:bg-remme-sage/10"
              >
                Location <ChevronRight aria-hidden className="h-4 w-4" />
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {zones.length === 0 ? (
              <p className="text-lg text-remme-ink/55">No safety zones configured.</p>
            ) : (
              <div className="mb-4 flex items-center gap-3 rounded-2xl bg-remme-sage/10 px-4 py-3">
                <span
                  className={`h-3 w-3 rounded-full ${
                    insideSafe ? "bg-remme-sage" : outsideSafe ? "bg-remme-amber" : "bg-remme-ink/40"
                  }`}
                  aria-hidden
                />
                <span className="text-lg font-medium text-remme-ink">
                  {insideSafe
                    ? `Inside ${zoneStatus.zone?.name ?? "a safe zone"}`
                    : outsideSafe
                      ? `Outside a safe zone (${zoneStatus.distanceM ?? "?"}m from ${zoneStatus.zone?.name ?? "nearest"})`
                      : "Last location not in a safe zone"}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Alerts feed */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between gap-2 text-xl">
            <span className="flex items-center gap-2">
              <Siren aria-hidden className="h-5 w-5 text-remme-status-attention" />
              Recent alerts
              {unreadAlerts > 0 ? (
                <Badge variant="attention">{unreadAlerts} unread</Badge>
              ) : null}
            </span>
            <Link
              href="/caregiver/alerts"
              className="inline-flex min-h-9 items-center gap-1 rounded-xl px-2 text-base font-medium text-remme-sage-deep hover:bg-remme-sage/10"
            >
              Alerts inbox <ChevronRight aria-hidden className="h-4 w-4" />
            </Link>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {alerts.length === 0 ? (
            <p className="text-lg text-remme-ink/55">No alerts — all quiet.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {alerts.map((a) => (
                <li
                  key={a.id}
                  className="flex items-start gap-3 rounded-2xl border border-remme-status-attention/10 bg-white/50 px-4 py-3"
                >
                  {a.isRead ? (
                    <CheckCircle2 aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-remme-sage" />
                  ) : (
                    <CircleAlert aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-remme-status-attention" />
                  )}
                  <div className="flex-1">
                    <p className="text-lg text-remme-ink">{a.message}</p>
                    <p className="text-sm text-remme-ink/50">
                      {a.type.replace(/_/g, " ").toLowerCase()} · {relativeLabel(a.createdAt)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {pendingToday.length > 0 && (
        <div className="flex justify-center">
          <Link
            href="/caregiver/reminders"
            className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-remme-amber/15 px-5 text-lg font-medium text-remme-sage-deep transition-colors hover:bg-remme-amber/25"
          >
            <BellRing aria-hidden className="h-5 w-5" />
            View {pendingToday.length} pending reminder{pendingToday.length === 1 ? "" : "s"}
          </Link>
        </div>
      )}
    </div>
  );
}
