import { requireCareSession } from "@/components/care/care-db";
import { prisma } from "@/lib/prisma";
import PeopleClient, { type PersonCardData } from "@/components/care/PeopleClient";

export const metadata = { title: "My people — Remme Care" };

/**
 * Section 3 — My People ("wallet" of the people you love).
 * Photo cards, add / edit / remove with a friendly inline form + photo picker.
 */
export default async function PeoplePage() {
  const ctx = await requireCareSession();

  const people = await prisma.person.findMany({
    where: { patientId: ctx.profile.id },
    orderBy: [{ createdAt: "asc" }],
  });

  const cardData: PersonCardData[] = people.map((p) => ({
    id: p.id,
    name: p.name,
    relationship: p.relationship,
    nickname: p.nickname,
    phoneNumber: p.phoneNumber,
    description: p.description,
    photoUrl: p.photoUrl,
  }));

  return (
    <div className="flex flex-col gap-6">
      {cardData.length > 0 ? null : (
        <section className="glass-panel flex flex-col gap-2 p-6 sm:p-7">
          <h1 className="text-caretitle font-semibold leading-tight text-remme-ink">
            My people
          </h1>
          <p className="text-caresubtitle leading-snug text-remme-ink/70">
            The faces that feel like home. Keep them close, one tap away.
          </p>
        </section>
      )}
      <PeopleClient people={cardData} />
    </div>
  );
}