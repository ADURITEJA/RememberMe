import { requireActivePatient } from "@/components/caregiver/caregiver-db";
import { prisma } from "@/lib/prisma";
import MoodHistory from "@/components/caregiver/MoodHistory";

export const metadata = { title: "Mood History — Remme Caregiver" };

export default async function CaregiverMoodPage({
  searchParams,
}: {
  searchParams: Promise<{ patient?: string | string[] }>;
}) {
  const { patient } = await searchParams;
  const { patient: active } = await requireActivePatient(patient);

  const raw = await prisma.moodCheckIn.findMany({
    where: { patientId: active.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const entries = raw.map((e) => ({
    id: e.id,
    mood: e.mood,
    note: e.note,
    createdAt: e.createdAt.toISOString(),
  }));

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <section className="flex flex-col gap-2">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-remme-ink dark:text-remme-inklight">
            Mood History for {active.name}
          </h2>
          <p className="text-lg text-remme-ink/65 dark:text-remme-inklight/65">
            {entries.length} entr{entries.length === 1 ? "y" : "ies"}
          </p>
        </div>
      </section>

      {/* Mood history */}
      <section>
        <MoodHistory entries={entries} />
      </section>
    </div>
  );
}