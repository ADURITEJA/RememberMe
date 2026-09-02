import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/profile/care-profile — Read the patient's CareProfile fields.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const careProfile = await prisma.careProfile.findUnique({
    where: { userId: session.user.id },
    select: {
      dateOfBirth: true,
      address: true,
      diagnosis: true,
      medicalNotes: true,
    },
  });

  if (!careProfile) {
    return NextResponse.json(
      { error: "No patient profile found for this account." },
      { status: 404 },
    );
  }

  return NextResponse.json(careProfile);
}

/**
 * PATCH /api/profile/care-profile — Update the patient's CareProfile fields.
 * Body: { dateOfBirth?: string, address?: string, diagnosis?: string, medicalNotes?: string }
 */
export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  // Only patients (CARE_USER) have a CareProfile
  const careProfile = await prisma.careProfile.findUnique({
    where: { userId: session.user.id },
  });

  if (!careProfile) {
    return NextResponse.json(
      { error: "No patient profile found for this account." },
      { status: 404 },
    );
  }

  let body: {
    dateOfBirth?: string;
    address?: string;
    diagnosis?: string;
    medicalNotes?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};

  if (body.dateOfBirth !== undefined) {
    updates.dateOfBirth = body.dateOfBirth ? new Date(body.dateOfBirth) : null;
  }
  if (body.address !== undefined) {
    updates.address = body.address?.trim() || null;
  }
  if (body.diagnosis !== undefined) {
    updates.diagnosis = body.diagnosis?.trim() || null;
  }
  if (body.medicalNotes !== undefined) {
    updates.medicalNotes = body.medicalNotes?.trim() || null;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No fields to update." }, { status: 400 });
  }

  await prisma.careProfile.update({
    where: { id: careProfile.id },
    data: updates,
  });

  return NextResponse.json({ ok: true });
}
