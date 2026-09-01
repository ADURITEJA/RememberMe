import { NextRequest } from "next/server";
import {
  getApiCareSession,
  unauthenticated,
} from "@/components/care/care-db";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/people — my people (photo cards) for /care/people.
 *
 * POST /api/people — add a person. photoUrl may be a data-URL from the
 * photo picker (kept simple + offline-friendly).
 */
export async function GET() {
  const ctx = await getApiCareSession();
  if (!ctx) return unauthenticated();

  const people = await prisma.person.findMany({
    where: { patientId: ctx.profile.id },
    orderBy: [{ createdAt: "asc" }],
  });

  return Response.json({ people });
}

export async function POST(request: NextRequest) {
  const ctx = await getApiCareSession();
  if (!ctx) return unauthenticated();

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Please send a valid form." }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const relationship = typeof body.relationship === "string" ? body.relationship.trim() : "";
  const nickname = typeof body.nickname === "string" ? body.nickname.trim() : "";
  const phoneNumber = typeof body.phoneNumber === "string" ? body.phoneNumber.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim() : "";
  const photoUrl = typeof body.photoUrl === "string" ? body.photoUrl.slice(0, 4_000_000) : "";

  if (!name) {
    return Response.json({ error: "Please tell us the person's name." }, { status: 400 });
  }

  const person = await prisma.person.create({
    data: {
      patientId: ctx.profile.id,
      name,
      relationship,
      nickname: nickname || null,
      phoneNumber: phoneNumber || null,
      description: description || null,
      photoUrl: photoUrl || null,
    },
  });

  // Let the emergency contacts list benefit too: if this person is clearly a
  // close contact with a phone number, surface them there as well. (Optional
  // but genuinely helpful for the SOS flow.)
  const closeRelationships = ["daughter", "son", "wife", "husband", "spouse", "caregiver", "carer", "sister", "brother", "niece", "nephew"];
  const isCloseAndContactable = relationship && phoneNumber &&
    closeRelationships.some((r) => relationship.toLowerCase().includes(r));

  if (isCloseAndContactable) {
    const existing = await prisma.emergencyContact.findFirst({
      where: { patientId: ctx.profile.id, phoneNumber },
    });
    if (!existing) {
      const count = await prisma.emergencyContact.count({ where: { patientId: ctx.profile.id } });
      await prisma.emergencyContact.create({
        data: {
          patientId: ctx.profile.id,
          name,
          phoneNumber,
          relationship,
          order: count + 1,
        },
      });
    }
  }

  return Response.json({ person }, { status: 201 });
}