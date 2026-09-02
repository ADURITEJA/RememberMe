import { requireActivePatient } from "@/components/caregiver/caregiver-db";
import { prisma } from "@/lib/prisma";
import { EmergencyContactsPanel } from "@/components/caregiver/EmergencyContactsPanel";

export const metadata = { title: "Emergency Contacts — Remme Caregiver" };

export default async function CaregiverEmergencyContactsPage({
  searchParams,
}: {
  searchParams: Promise<{ patient?: string | string[] }>;
}) {
  const { patient: active } = await requireActivePatient((await searchParams).patient);

  const contacts = await prisma.emergencyContact.findMany({
    where: { patientId: active.id },
    orderBy: { order: "asc" },
  });

  const rows = contacts.map((c) => ({
    id: c.id,
    patientId: c.patientId,
    name: c.name,
    phoneNumber: c.phoneNumber,
    relationship: c.relationship,
    order: c.order,
  }));

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-1">
        <h2 className="text-2xl font-semibold tracking-tight text-remme-ink dark:text-remme-inklight">
          {active.name}&apos;s emergency contacts
        </h2>
        <p className="text-lg text-remme-ink/65 dark:text-remme-inklight/65">
          These contacts are shown during SOS and called automatically if the patient needs help.
        </p>
      </section>

      <EmergencyContactsPanel patientId={active.id} contacts={rows} />
    </div>
  );
}
