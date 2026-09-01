import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, ROLES } from "@/lib/authz";

/**
 * POST /api/caregiver/link
 * Links the signed-in CAREGIVER (or ADMIN) to a patient's CareProfile.
 * Body: { patientEmail: string }  —or—  { profileId: string }
 *
 * Duplicate links are rejected with 409.
 */

async function findProfileId(body: { patientEmail?: string; profileId?: string }) {
  if (body.profileId) {
    const profile = await prisma.careProfile.findUnique({
      where: { id: body.profileId },
      select: { id: true },
    });
    return profile?.id ?? null;
  }
  if (body.patientEmail) {
    const patient = await prisma.user.findUnique({
      where: { email: (body.patientEmail as string).trim().toLowerCase() },
      select: { careProfile: { select: { id: true } } },
    });
    return patient?.careProfile?.id ?? null;
  }
  return null;
}

export async function POST(request: Request) {
  const user = await requireRole(ROLES.CAREGIVER, ROLES.ADMIN);

  const body = (await request.json().catch(() => null)) as
    | { patientEmail?: string; profileId?: string }
    | null;

  if (!body) {
    return NextResponse.json(
      { error: "Missing request body.", fieldErrors: {} },
      { status: 400 },
    );
  }

  if (!body.patientEmail && !body.profileId) {
    return NextResponse.json(
      {
        error: { field: "patientEmail", message: "Enter the email of the person you will care for." },
        fieldErrors: {
          patientEmail: "Enter the email of the person you will care for.",
        },
      },
      { status: 400 },
    );
  }

  const patientEmail = (body.patientEmail as string | undefined)?.trim().toLowerCase();
  if (body.patientEmail && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(patientEmail as string)) {
    return NextResponse.json(
      {
        error: { field: "patientEmail", message: "Enter a valid email address." },
        fieldErrors: { patientEmail: "Enter a valid email address." },
      },
      { status: 400 },
    );
  }

  const profileId = await findProfileId(body);
  if (!profileId) {
    return NextResponse.json(
      {
        error: { field: "patientEmail", message: "We couldn't find a Remme account for that person." },
        fieldErrors: { patientEmail: "We couldn't find a Remme account for that person." },
      },
      { status: 404 },
    );
  }

  // Self-link guard: a CARE_USER shouldn't act as their own caregiver.
  const ownProfile = await prisma.careProfile.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });
  if (ownProfile?.id === profileId) {
    return NextResponse.json(
      { error: "You can't link to your own patient profile." },
      { status: 400 },
    );
  }

  // Duplicate check
  const existing = await prisma.caregiverRelationship.findUnique({
    where: { caregiverId_patientId: { caregiverId: user.id, patientId: profileId } },
  });
  if (existing) {
    return NextResponse.json(
      {
        error: { field: "patientEmail", message: "You are already linked to this person." },
        fieldErrors: { patientEmail: "You are already linked to this person." },
      },
      { status: 409 },
    );
  }

  const relationship = await prisma.caregiverRelationship.create({
    data: {
      caregiverId: user.id,
      patientId: profileId,
      permissions: JSON.stringify({ alerts: true, location: true, reminders: true }),
    },
  });

  return NextResponse.json(
    { ok: true, id: relationship.id, patientId: profileId },
    { status: 201 },
  );
}