import { requireActivePatient } from "@/components/caregiver/caregiver-db";
import { prisma } from "@/lib/prisma";
import { ZonePanel } from "@/components/caregiver/ZonePanel";

export const metadata = { title: "Safety Zones — Remme Caregiver" };

export default async function CaregiverZonesPage({
  searchParams,
}: {
  searchParams: Promise<{ patient?: string | string[] }>;
}) {
  const { patient: active } = await requireActivePatient((await searchParams).patient);

  const zones = await prisma.safetyZone.findMany({
    where: { patientId: active.id },
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
  });

  const rows = zones.map((z) => ({
    id: z.id,
    patientId: z.patientId,
    name: z.name,
    lat: z.lat,
    lng: z.lng,
    radius: z.radius,
    activeHours: z.activeHours,
    isActive: z.isActive,
  }));

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-1">
        <h2 className="text-2xl font-semibold tracking-tight text-remme-ink dark:text-remme-inklight">
          {active.name}&apos;s safety zones
        </h2>
        <p className="text-lg text-remme-ink/65 dark:text-remme-inklight/65">
          Define areas where your patient is safe. You&apos;ll be alerted if they leave a zone.
        </p>
      </section>

      <ZonePanel patientId={active.id} zones={rows} />
    </div>
  );
}
