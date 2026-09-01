import { NextRequest } from "next/server";
import { getApiCaregiverSession, unauthenticated, forbidden } from "@/components/caregiver/caregiver-db";
import { prisma } from "@/lib/prisma";

/**
 * PATCH /api/medications/[id] — Update medication fields (caregiver only).
 * DELETE /api/medications/[id] — Remove medication (caregiver only).
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await getApiCaregiverSession();
  if (!session) return unauthenticated();
  if (session.patients.length === 0) return forbidden();

  const patientId = session.patients[0].id;
  const existing = await prisma.medication.findFirst({
    where: { id, patientId },
  });
  if (!existing) {
    return Response.json({ error: "Medication not found." }, { status: 404 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  if (typeof body.name === "string" && body.name.trim()) data.name = body.name.trim();
  if (typeof body.dosage === "string" && body.dosage.trim()) data.dosage = body.dosage.trim();
  if (typeof body.instructions === "string") data.instructions = body.instructions.trim() || null;
  if (typeof body.imageUrl === "string") data.imageUrl = body.imageUrl.trim() || null;
  if (typeof body.frequency === "string") data.frequency = body.frequency;
  if (typeof body.times === "string" && body.times.trim()) data.times = body.times.trim();
  if (typeof body.refillDate === "string") data.refillDate = body.refillDate ? new Date(body.refillDate) : null;
  if (typeof body.isActive === "boolean") data.isActive = body.isActive;

  await prisma.medication.update({ where: { id }, data });

  return Response.json({ ok: true });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await getApiCaregiverSession();
  if (!session) return unauthenticated();
  if (session.patients.length === 0) return forbidden();

  const patientId = session.patients[0].id;
  const existing = await prisma.medication.findFirst({
    where: { id, patientId },
  });
  if (!existing) {
    return Response.json({ error: "Medication not found." }, { status: 404 });
  }

  await prisma.medication.delete({ where: { id } });

  return Response.json({ ok: true });
}
