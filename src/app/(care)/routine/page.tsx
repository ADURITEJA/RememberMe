import { requireCareSession } from "@/components/care/care-db";
import { prisma } from "@/lib/prisma";
import { Sunrise, Sun, Moon } from "lucide-react";
import { RoutineStepItem } from "@/components/care/RoutineStepItem";

const PERIODS = [
  { key: "Morning", label: "Morning", icon: Sunrise, color: "text-remme-amber", bg: "bg-remme-amber/10" },
  { key: "Afternoon", label: "Afternoon", icon: Sun, color: "text-remme-sage", bg: "bg-remme-sage/10" },
  { key: "Evening", label: "Evening", icon: Moon, color: "text-remme-ink/60", bg: "bg-remme-ink/5" },
] as const;

export const metadata = { title: "My Routines — Remme Care" };

export default async function RoutinePage() {
  const ctx = await requireCareSession();
  const profileId = ctx.profile.id;

  const routines = await prisma.routine.findMany({
    where: { patientId: profileId, isActive: true },
    include: { steps: { orderBy: { order: "asc" } } },
    orderBy: { name: "asc" },
  });

  // Group by period name (Morning/Afternoon/Evening)
  const grouped = PERIODS.map((p) => {
    const routine = routines.find((r) => r.name === p.key);
    return { period: p, steps: routine?.steps ?? [] };
  });

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <section className="flex flex-col gap-2">
        <h1 className="text-caretitle font-semibold leading-tight tracking-tight text-remme-ink">
          Your daily rhythm
        </h1>
        <p className="max-w-xl text-caresubtitle leading-snug text-remme-ink/70">
          Gentle steps for each part of your day. Tap a step when it&apos;s done —
          we&apos;ll remember it for today.
        </p>
      </section>

      {/* Period buckets */}
      <div className="flex flex-col gap-6">
        {grouped.map(({ period, steps }) => (
          <section key={period.key} className="glass-panel flex flex-col gap-4 p-5 sm:p-6">
            {/* Period header */}
            <header className="flex items-center gap-3">
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${period.bg}`}>
                <period.icon aria-hidden className={`h-7 w-7 ${period.color}`} />
              </div>
              <h2 className={`text-2xl font-semibold ${period.color}`}>{period.label}</h2>
            </header>

            {/* Steps */}
            {steps.length > 0 ? (
              <ul className="flex flex-col gap-3" role="list" aria-label={`${period.label} routine steps`}>
                {steps.map((step) => (
                  <RoutineStepItem key={step.id} step={step} profileId={profileId} />
                ))}
              </ul>
            ) : (
              <p className="glass-solid rounded-2xl p-4 text-center text-remme-ink/55">
                No steps for {period.label.toLowerCase()} yet. Your caregiver can add them
                from their dashboard.
              </p>
            )}
          </section>
        ))}
      </div>

      {/* Footer */}
      <section className="glass-card flex flex-col items-center gap-2 p-6 text-center">
        <p className="text-lg leading-relaxed text-remme-ink/80 max-w-xl">
          One small step at a time. Every check is a win. 💛
        </p>
      </section>
    </div>
  );
}