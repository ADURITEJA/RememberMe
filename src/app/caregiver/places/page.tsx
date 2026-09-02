import { requireActivePatient } from "@/components/caregiver/caregiver-db";
import { prisma } from "@/lib/prisma";
import { PlacesPanel } from "@/components/caregiver/PlacesPanel";

export const metadata = { title: "Places — Remme Caregiver" };

export default async function CaregiverPlacesPage({
  searchParams,
}: {
  searchParams: Promise<{ patient?: string | string[] }>;
}) {
  const { patient: active } = await requireActivePatient((await searchParams).patient);

  const places = await prisma.importantPlace.findMany({
    where: { patientId: active.id },
    orderBy: { name: "asc" },
  });

  const rows = places.map((p) => ({
    id: p.id,
    patientId: p.patientId,
    name: p.name,
    address: p.address,
    lat: p.lat,
    lng: p.lng,
    contactNumber: p.contactNumber,
    notes: p.notes,
    photoUrl: p.photoUrl,
  }));

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-1">
        <h2 className="text-2xl font-semibold tracking-tight text-remme-ink dark:text-remme-inklight">
          {active.name}&apos;s places
        </h2>
        <p className="text-lg text-remme-ink/65 dark:text-remme-inklight/65">
          Important places like home, pharmacy, or the doctor&apos;s office — used for orientation and safety.
        </p>
      </section>

      <PlacesPanel patientId={active.id} places={rows} />
    </div>
  );
}
