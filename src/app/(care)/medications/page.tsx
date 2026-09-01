import { Bell, CheckCircle2, Pill, Sunrise } from "lucide-react";
import { requireCareSession } from "@/components/care/care-db";
import { prisma } from "@/lib/prisma";
import EmptyState from "@/components/care/EmptyState";
import MedicationPillCard, { type MedicationRow } from "@/components/care/MedicationPillCard";
import { startOfDay, endOfDay } from "date-fns";

export const metadata = { title: "My medications — Remme Care" };

/**
 * Medications Page — Today's pill schedule with one-tap "I took it" / "Skip".
 *
 * Fetches active medications and today's logs. Groups into:
 * - "Up next" (pending doses for today)
 * - "Taken today" (completed doses)
 */
export default async function MedicationsPage() {
  const ctx = await requireCareSession();
  const today = new Date();

  const medications = await prisma.medication.findMany({
    where: { patientId: ctx.profile.id, isActive: true },
    orderBy: [{ times: "asc" }, { createdAt: "asc" }],
    include: {
      logs: {
        where: {
          scheduledFor: { gte: startOfDay(today), lte: endOfDay(today) },
        },
        take: 1,
        orderBy: { scheduledFor: "asc" },
      },
    },
  });

  const pendingToday = medications.filter(
    (m) => !m.logs[0] || (m.logs[0].status !== "TAKEN" && m.logs[0].status !== "SKIPPED")
  );
  const completedToday = medications.filter(
    (m) => m.logs[0] && (m.logs[0].status === "TAKEN" || m.logs[0].status === "SKIPPED")
  );

  const mapRow = (m: (typeof medications)[number]): MedicationRow => ({
    id: m.id,
    name: m.name,
    dosage: m.dosage,
    instructions: m.instructions,
    imageUrl: m.imageUrl,
    times: m.times,
    log: m.logs[0]
      ? { id: m.logs[0].id, status: m.logs[0].status, takenAt: m.logs[0].takenAt?.toISOString() ?? null }
      : null,
  });

  const pillMessage = (completed: number, total: number) => {
    if (total === 0) return null;
    if (completed === 0) return "No doses taken yet — no rush.";
    if (completed === total) return "All doses done for today! 🎉";
    return `${completed} of ${total} doses done so far — keep going.`;
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Hero */}
      <section className="glass-panel flex flex-col gap-4 p-6 sm:p-7">
        <div className="flex items-start gap-4">
          <span className="grid h-20 w-20 shrink-0 place-items-center rounded-3xl bg-remme-sage/15 text-4xl">
            💊
          </span>
          <div className="flex flex-col gap-2">
            <h1 className="text-caretitle font-semibold leading-tight text-remme-ink">
              Today's medications
            </h1>
            <p className="text-caresubtitle leading-snug text-remme-ink/70">
              Take them one at a time — you are safe and cared for.
            </p>
            {pillMessage(completedToday.length, medications.length) ? (
              <p className="mt-1 flex items-center gap-2 rounded-xl bg-remme-sage/8 px-4 py-2 text-lg font-medium text-remme-sage-deep">
                <CheckCircle2 aria-hidden className="h-5 w-5 text-remme-sage" />
                {pillMessage(completedToday.length, medications.length)}
              </p>
            ) : null}
          </div>
        </div>
      </section>

      {/* Pending doses */}
      <section className="flex flex-col gap-3">
        <h2 className="flex items-center gap-2 text-2xl font-semibold text-remme-ink">
          <Pill aria-hidden className="h-6 w-6 text-remme-sage" />
          Up next
        </h2>
        {pendingToday.length === 0 ? (
          <EmptyState
            icon={<Sunrise aria-hidden className="h-10 w-10" />}
            title="All caught up!"
            message="No pending doses right now — you're doing great."
          />
        ) : (
          <div className="flex flex-col gap-3">
            {pendingToday.map((m) => (
              <MedicationPillCard key={m.id} medication={mapRow(m)} size="large" />
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
            {completedToday.map((m) => (
              <MedicationPillCard key={m.id} medication={mapRow(m)} />
            ))}
          </div>
        </section>
      ) : null}

      {/* Helpful footer */}
      <section className="glass-card flex flex-col items-center gap-3 p-6 text-center">
        <Pill aria-hidden className="h-9 w-9 text-remme-sage" />
        <p className="max-w-md text-lg leading-relaxed text-remme-ink/75">
          If you're not sure about a dose, it's okay to skip and ask your caregiver.
        </p>
      </section>
    </div>
  );
}