import { requireActivePatient } from "@/components/caregiver/caregiver-db";
import { prisma } from "@/lib/prisma";
import PeoplePanel from "@/components/caregiver/PeoplePanel";

export const metadata = { title: "People — Remme Caregiver" };

export default async function CaregiverPeoplePage({
  searchParams,
}: {
  searchParams: Promise<{ patient?: string | string[] }>;
}) {
  const { patient: active } = await requireActivePatient((await searchParams).patient);

  const people = await prisma.person.findMany({
    where: { patientId: active.id },
    orderBy: [{ createdAt: "asc" }],
  });

  const rows = people.map((p) => ({
    id: p.id,
    name: p.name,
    relationship: p.relationship,
    nickname: p.nickname,
    phoneNumber: p.phoneNumber,
    description: p.description,
    photoUrl: p.photoUrl,
  }));

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-1">
        <h2 className="text-2xl font-semibold tracking-tight text-remme-ink dark:text-remme-inklight">
          {active.name}&apos;s people
        </h2>
        <p className="text-lg text-remme-ink/65 dark:text-remme-inklight/65">
          The family and friends who matter, kept current for memory quizzes and contact.
        </p>
      </section>

      <PeoplePanel patientId={active.id} people={rows} />
    </div>
  );
}
