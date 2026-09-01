import { Bell, CheckCircle2, Smile, Stethoscope, Timer } from "lucide-react";
import { requireCareSession } from "@/components/care/care-db";
import { prisma } from "@/lib/prisma";
import EmptyState from "@/components/care/EmptyState";
import ReminderCheckRow, { type ReminderRowData } from "@/components/care/ReminderCheckRow";
import NewReminderForm from "@/components/care/NewReminderForm";
import { startOfDay, endOfDay } from "date-fns";
import Link from "next/link";

export const metadata = { title: "My reminders — Remme Care" };

/**
 * Section 2 — Reminders. Friendly big text, grouped by status (up next vs
 * completed today), gentle "did you take your pills?" flow persisted to
 * ReminderOccurrence, and a new-reminder form at the bottom.
 */
export default async function RemindersPage() {
  const ctx = await requireCareSession();
  const today = new Date();

  const reminders = await prisma.reminder.findMany({
    where: { patientId: ctx.profile.id },
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
  });

  const activeReminders = reminders.filter((r) => r.isActive);
  const pendingToday = activeReminders.filter((r) => r.occurrences[0]?.status !== "COMPLETED");
  const completedToday = activeReminders.filter((r) => r.occurrences[0]?.status === "COMPLETED");

  const mapRow = (r: (typeof reminders)[number]): ReminderRowData => ({
    id: r.id,
    title: r.title,
    description: r.description,
    time: r.time,
    icon: r.icon,
    category: r.category,
    completed: r.occurrences[0]?.status === "COMPLETED",
  });

  const pillMessage = (completed: number, total: number) => {
    if (total === 0) return null;
    if (completed === 0) return "You haven't completed any reminders yet — no rush.";
    if (completed === total) return "All done for today! 🎉";
    return `${completed} of ${total} reminders completed so far — keep going.`;
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Hero */}
      <section className="glass-panel flex flex-col gap-4 p-6 sm:p-7">
        <div className="flex items-start gap-4">
          <span className="grid h-20 w-20 shrink-0 place-items-center rounded-3xl bg-remme-amber/15 text-4xl">
            💊
          </span>
          <div className="flex flex-col gap-2">
            <h1 className="text-caretitle font-semibold leading-tight text-remme-ink">
              Remember your meds
            </h1>
            <p className="text-caresubtitle leading-snug text-remme-ink/70">
              Take them one at a time — you are safe and cared for.
            </p>
            {pillMessage(completedToday.length, activeReminders.length) ? (
              <p className="mt-1 flex items-center gap-2 rounded-xl bg-remme-sage/8 px-4 py-2 text-lg font-medium text-remme-sage-deep">
                <CheckCircle2 aria-hidden className="h-5 w-5 text-remme-sage" />
                {pillMessage(completedToday.length, activeReminders.length)}
              </p>
            ) : null}
          </div>
        </div>
      </section>

      {/* Pending reminders */}
      <section className="flex flex-col gap-3">
        <h2 className="flex items-center gap-2 text-2xl font-semibold text-remme-ink">
          <Timer aria-hidden className="h-6 w-6 text-remme-sage" />
          Up next
        </h2>
        {pendingToday.length === 0 ? (
          <EmptyState
            icon={<Stethoscope aria-hidden className="h-10 w-10" />}
            title="All quiet for now"
            message="No pending reminders right now — you're doing great."
          />
        ) : (
          <div className="flex flex-col gap-3">
            {pendingToday.map((r) => (
              <ReminderCheckRow key={r.id} reminder={mapRow(r)} size="large" />
            ))}
          </div>
        )}
      </section>

      {/* Completed today */}
      {completedToday.length > 0 ? (
        <section className="flex flex-col gap-3">
          <h2 className="flex items-center gap-2 text-2xl font-semibold text-remme-sage-deep">
            <CheckCircle2 aria-hidden className="h-6 w-6" />
            Done today
          </h2>
          <div className="flex flex-col gap-3">
            {completedToday.map((r) => (
              <ReminderCheckRow key={r.id} reminder={mapRow(r)} />
            ))}
          </div>
        </section>
      ) : null}

      {/* New reminder */}
      <NewReminderForm />

      {/* Warm link to mood if stressed */}
      <section className="glass-card flex flex-col items-center gap-3 p-6 text-center">
        <Smile aria-hidden className="h-9 w-9 text-remme-amber" />
        <p className="max-w-md text-lg leading-relaxed text-remme-ink/75">
          If any of this feels like a lot, it&apos;s okay. You can check in with your mood
          or talk to Remma any time.
        </p>
        <div className="mt-1 flex flex-wrap justify-center gap-3">
          <Link
            href="/mood"
            className="min-h-11 rounded-xl bg-remme-amber/10 px-4 py-2.5 text-base font-medium text-remme-sage-deep transition-colors hover:bg-remme-amber/20"
          >
            Check my mood
          </Link>
          <Link
            href="/assistant"
            className="min-h-11 rounded-xl bg-remme-sage/10 px-4 py-2.5 text-base font-medium text-remme-sage-deep transition-colors hover:bg-remme-sage/15"
          >
            Ask Remma
          </Link>
        </div>
      </section>
    </div>
  );
}