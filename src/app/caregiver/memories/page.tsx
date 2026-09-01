import { format } from "date-fns";
import { requireActivePatient } from "@/components/caregiver/caregiver-db";
import { prisma } from "@/lib/prisma";
import MemoryLibrary from "@/components/caregiver/MemoryLibrary";

export const metadata = { title: "Memory Library — Remme Caregiver" };

export default async function CaregiverMemoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ patient?: string | string[] }>;
}) {
  const { patient: active } = await requireActivePatient((await searchParams).patient);

  const memories = await prisma.memory.findMany({
    where: { patientId: active.id },
    orderBy: [{ date: "desc" }],
    include: {
      media: { select: { url: true } },
      transcript: true,
    },
  });

  const rows = memories.map((m) => ({
    id: m.id,
    title: m.title,
    description: m.description,
    date: (() => {
      try {
        return format(m.date, "MMMM d, yyyy");
      } catch {
        return m.date.toISOString().slice(0, 10);
      }
    })(),
    location: m.location,
    mediaCount: m.media.length,
    transcript: m.transcript?.text ?? null,
  }));

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-1">
        <h2 className="text-2xl font-semibold tracking-tight text-remme-ink dark:text-remme-inklight">
          {active.name}&apos;s memory library
        </h2>
        <p className="text-lg text-remme-ink/65 dark:text-remme-inklight/65">
          Moments worth remembering — with a printable record you can share with their circle.
        </p>
      </section>

      <MemoryLibrary memories={rows} patientName={active.name} />
    </div>
  );
}
