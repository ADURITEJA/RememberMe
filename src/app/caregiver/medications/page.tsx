import { Pill } from "lucide-react";
import { requireActivePatient } from "@/components/caregiver/caregiver-db";
import { prisma } from "@/lib/prisma";
import MedicationPanel from "@/components/caregiver/MedicationPanel";
import { subDays, startOfDay, endOfDay } from "date-fns";

export const metadata = { title: "Medications — Remme Caregiver" };

export default async function CaregiverMedicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ patient?: string | string[] }>;
}) {
  const { patient: active } = await requireActivePatient((await searchParams).patient);

  const now = new Date();
  const thirtyDaysAgo = subDays(now, 30);
  const sevenDaysAgo = subDays(now, 7);

  // Fetch all medications + last 30 days of logs
  const [medications, logs] = await Promise.all([
    prisma.medication.findMany({
      where: { patientId: active.id },
      orderBy: [{ isActive: "desc" }, { createdAt: "asc" }],
    }),
    prisma.medicationLog.findMany({
      where: {
        medication: { patientId: active.id },
        scheduledFor: { gte: thirtyDaysAgo },
      },
      orderBy: { scheduledFor: "desc" },
    }),
  ]);

  // Compute per-medication adherence (last 30 days)
  const medAdherence = medications.map((med) => {
    const medLogs = logs.filter((l) => l.medicationId === med.id);
    return {
      id: med.id,
      name: med.name,
      dosage: med.dosage,
      instructions: med.instructions,
      imageUrl: med.imageUrl,
      frequency: med.frequency,
      times: med.times,
      refillDate: med.refillDate?.toISOString() ?? null,
      isActive: med.isActive,
      adherence: {
        taken: medLogs.filter((l) => l.status === "TAKEN").length,
        skipped: medLogs.filter((l) => l.status === "SKIPPED").length,
        missed: medLogs.filter((l) => l.status === "MISSED").length,
        total: medLogs.length,
      },
    };
  });

  // Log entries for missed-dose alert computation (last 7 days)
  const recentLogs = logs
    .filter((l) => l.scheduledFor >= sevenDaysAgo)
    .map((l) => ({
      medicationId: l.medicationId,
      status: l.status,
      scheduledFor: l.scheduledFor.toISOString(),
    }));

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-1">
        <div className="flex items-center gap-3">
          <Pill aria-hidden className="h-6 w-6 text-remme-sage" />
          <h2 className="text-2xl font-semibold tracking-tight text-remme-ink dark:text-remme-inklight">
            {active.name}&apos;s medications
          </h2>
        </div>
        <p className="text-lg text-remme-ink/65 dark:text-remme-inklight/65">
          Manage medications, track adherence, and monitor refill dates.
        </p>
      </section>

      <MedicationPanel
        patientId={active.id}
        medications={medAdherence}
        logs={recentLogs}
      />
    </div>
  );
}
