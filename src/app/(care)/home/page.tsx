import Link from "next/link";
import { format } from "date-fns";
import {
  ImagePlus,
  Smile,
  Bot,
  Bell,
  Pill,
  Sunrise,
  Sparkles,
  ChevronRight,
  HeartHandshake,
} from "lucide-react";
import { requireCareSession, greetingForTime } from "@/components/care/care-db";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import ReminderCheckRow, { type ReminderRowData } from "@/components/care/ReminderCheckRow";
import { startOfDay, endOfDay } from "date-fns";

export const metadata = { title: "Home — Remme Care" };

export default async function CareHomePage() {
  const ctx = await requireCareSession();
  const { greeting } = greetingForTime(new Date());
  const today = new Date();
  const todayLabel = format(today, "EEEE, MMMM d");

  const [reminders, memoryCount, peopleCount, moodToday, medicationCount] = await Promise.all([
    prisma.reminder.findMany({
      where: { patientId: ctx.profile.id, isActive: true },
      orderBy: [{ time: "asc" }, { createdAt: "asc" }],
      include: {
        occurrences: {
          where: {
            scheduledFor: { gte: startOfDay(today), lte: endOfDay(today) },
          },
          take: 1,
          orderBy: { scheduledFor: "asc" },
        },
      },
    }),
    prisma.memory.count({ where: { patientId: ctx.profile.id } }),
    prisma.person.count({ where: { patientId: ctx.profile.id } }),
    prisma.moodCheckIn.count({
      where: {
        patientId: ctx.profile.id,
        createdAt: { gte: startOfDay(today) },
      },
    }),
    prisma.medication.count({ where: { patientId: ctx.profile.id, isActive: true } }),
  ]);

  // "Up next" — the next 3 reminders that aren't already done today.
  const upcoming = reminders
    .filter((r) => r.occurrences[0]?.status !== "COMPLETED")
    .slice(0, 3);

  const quickActions = [
    {
      href: "/memories/new",
      label: "Add a memory",
      hint: "Save today's moment",
      icon: <ImagePlus aria-hidden className="h-7 w-7" />,
      color: "bg-remme-sage text-white",
    },
    {
      href: "/mood",
      label: "Check my mood",
      hint: "How are you feeling?",
      icon: <Smile aria-hidden className="h-7 w-7" />,
      color: "bg-remme-amber text-white",
    },
    {
      href: "/assistant",
      label: "Ask Remma",
      hint: "Your gentle helper",
      icon: <Bot aria-hidden className="h-7 w-7" />,
      color: "bg-remme-sage-deep text-white",
    },
    {
      href: "/medications",
      label: "My medications",
      hint: `${medicationCount} active med${medicationCount !== 1 ? "s" : ""}`,
      icon: <Pill aria-hidden className="h-7 w-7" />,
      color: "bg-remme-sage text-white",
    },
  ];

  const reminderRows: ReminderRowData[] = upcoming.map((r) => ({
    id: r.id,
    title: r.title,
    description: r.description,
    time: r.time,
    icon: r.icon,
    category: r.category,
    completed: r.occurrences[0]?.status === "COMPLETED",
  }));

  return (
    <div className="flex flex-col gap-8">
      {/* Greeting */}
      <section className="flex flex-col gap-2">
        <p className="flex items-center gap-2 text-base font-medium text-remme-sage-deep">
          <Sunrise aria-hidden className="h-5 w-5" />
          {todayLabel}
        </p>
        <h1 className="text-caretitle font-semibold leading-tight tracking-tight text-remme-ink">
          {greeting}, {ctx.userName}
        </h1>
        <p className="max-w-xl text-caresubtitle leading-snug text-remme-ink/70">
          You&apos;re doing wonderfully today. Here&apos;s a little of your world at a glance.
        </p>
      </section>

      {/* Quick actions */}
      <section aria-label="Quick actions" className="grid gap-3 sm:grid-cols-3">
        {quickActions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="glass-card flex min-h-36 flex-col justify-between gap-3 p-5 transition-all hover:shadow-glass focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-remme-sage/40"
          >
            <span className={`inline-flex h-14 w-14 items-center justify-center rounded-2xl ${action.color}`}>
              {action.icon}
            </span>
            <span className="flex flex-col">
              <span className="text-xl font-semibold text-remme-ink">{action.label}</span>
              <span className="text-base text-remme-ink/55">{action.hint}</span>
            </span>
          </Link>
        ))}
      </section>

      {/* Your day summary */}
      <section className="glass-panel flex flex-col gap-5 p-6 sm:p-7">
        <h2 className="flex items-center gap-2 text-2xl font-semibold text-remme-ink">
          <Sparkles aria-hidden className="h-6 w-6 text-remme-amber" />
          Your day, all together
        </h2>
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div className="glass-solid flex flex-col gap-1 rounded-2xl p-4">
            <dt className="text-base text-remme-ink/55">Memories kept</dt>
            <dd className="text-4xl font-bold text-remme-sage-deep">{memoryCount}</dd>
          </div>
          <div className="glass-solid flex flex-col gap-1 rounded-2xl p-4">
            <dt className="text-base text-remme-ink/55">People you love</dt>
            <dd className="text-4xl font-bold text-remme-sage-deep">{peopleCount}</dd>
          </div>
          <div className="glass-solid flex flex-col gap-1 rounded-2xl p-4">
            <dt className="text-base text-remme-ink/55">Active meds</dt>
            <dd className="text-4xl font-bold text-remme-sage-deep">{medicationCount}</dd>
          </div>
          <div className="glass-solid flex flex-col gap-1 rounded-2xl p-4">
            <dt className="text-base text-remme-ink/55">Mood checks today</dt>
            <dd className="text-4xl font-bold text-remme-sage-deep">{moodToday}</dd>
          </div>
        </dl>
      </section>

      {/* Up-next reminders */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-2xl font-semibold text-remme-ink">
            <Bell aria-hidden className="h-6 w-6 text-remme-sage" />
            Up next
          </h2>
          <Link
            href="/reminders"
            className="inline-flex min-h-11 items-center gap-1 rounded-xl px-3 text-base font-medium text-remme-sage-deep hover:bg-remme-sage/10"
          >
            See all <ChevronRight aria-hidden className="h-5 w-5" />
          </Link>
        </div>

        {reminderRows.length === 0 ? (
          <p className="glass-card rounded-2xl p-5 text-lg text-remme-ink/60">
            Nothing pressing right now — enjoy the quiet. {memoryCount === 0 ? "Maybe save a memory? 💛" : ""}
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {reminderRows.map((reminder) => (
              <ReminderCheckRow key={reminder.id} reminder={reminder} />
            ))}
          </div>
        )}
      </section>

      {/* Warm footer */}
      <section className="glass-card flex flex-col items-center gap-2 p-6 text-center">
        <HeartHandshake aria-hidden className="h-9 w-9 text-remme-sage" />
        <p className="text-lg leading-relaxed text-remme-ink/80">
          You are never alone — Remme and the people who love you are just a tap away.
        </p>
        <Link href="/sos" className="mt-1">
          <Button variant="outline" size="default" className="min-touch">
            Need help right now?
          </Button>
        </Link>
      </section>
    </div>
  );
}