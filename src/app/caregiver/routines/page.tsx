import { CalendarDays } from "lucide-react";
import { requireActivePatient } from "@/components/caregiver/caregiver-db";
import { prisma } from "@/lib/prisma";
import RoutinePanel from "@/components/caregiver/RoutinePanel";

export const metadata = { title: "Routines — Remme Caregiver" };

export default async function CaregiverRoutinesPage({
  searchParams,
}: {
  searchParams: Promise<{ patient?: string | string[] }>;
}) {
  const { patient: active } = await requireActivePatient((await searchParams).patient);

  const routines = await prisma.routine.findMany({
    where: { patientId: active.id },
    include: { steps: { orderBy: { order: "asc" } } },
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
  });

  const rows = routines.map((r) => ({
    id: r.id,
    name: r.name,
    isActive: r.isActive,
    steps: r.steps.map((s) => ({
      id: s.id,
      title: s.title,
      timeEst: s.timeEst,
      order: s.order,
    })),
  }));

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-1">
        <div className="flex items-center gap-3">
          <CalendarDays aria-hidden className="h-6 w-6 text-remme-sage" />
          <h2 className="text-2xl font-semibold tracking-tight text-remme-ink dark:text-remme-inklight">
            {active.name}&apos;s routines
          </h2>
        </div>
        <p className="text-lg text-remme-ink/65 dark:text-remme-inklight/65">
          Build gentle daily rhythms for the person you care for. Steps appear on their routine screen.
        </p>
      </section>

      <RoutinePanel patientId={active.id} routines={rows} />
    </div>
  );
}
