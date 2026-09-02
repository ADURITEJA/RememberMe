import { NextResponse } from "next/server";
import { getCaregiverSession } from "@/components/caregiver/caregiver-db";
import { prisma } from "@/lib/prisma";

/**
 * DELETE /api/caregiver/relationships/:id
 *
 * Unlink a patient from the current caregiver.
 * Deletes the CaregiverPatient record (the join row).
 * The patient, their records, and their other caregivers remain intact.
 */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: patientId } = await params;

  const session = await getCaregiverSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const link = await prisma.caregiverRelationship.findUnique({
    where: {
      caregiverId_patientId: {
        caregiverId: session.userId,
        patientId,
      },
    },
  });

  if (!link) {
    return NextResponse.json(
      { error: "You are not linked to this patient." },
      { status: 404 },
    );
  }

  await prisma.caregiverRelationship.delete({
    where: {
      caregiverId_patientId: {
        caregiverId: session.userId,
        patientId,
      },
    },
  });

  return NextResponse.json({ ok: true });
}
