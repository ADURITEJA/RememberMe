import { NextRequest } from "next/server";
import {
  getApiCareSession,
  unauthenticated,
} from "@/components/care/care-db";
import { prisma } from "@/lib/prisma";

/**
 * PUT /api/people/[id] — update a person.
 *
 * DELETE /api/people/[id] — remove a person.
 *
 * Every operation is scoped to the caller's own CareProfile.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const ctx = await getApiCareSession();
  if (!ctx) return unauthenticated();
  const { id } = await params;

  const existing = await prisma.person.findFirst({
    where: { id, patientId: ctx.profile.id },
  });
  if (!existing) {
    return Response.json({ error: "Person not found." }, { status: 404 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Please send a valid form." }, { status: 400 });
  }

  const name =
    typeof body.name === "string" && body.name.trim()
      ? body.name.trim()
      : existing.name;
  const relationship =
    typeof body.relationship === "string" ? body.relationship.trim() : existing.relationship;
  const nickname =
    typeof body.nickname === "string" ? (body.nickname.trim() || null) : existing.nickname;
  const phoneNumber =
    typeof body.phoneNumber === "string"
      ? (body.phoneNumber.trim() || null)
      : existing.phoneNumber;
  const description =
    typeof body.description === "string"
      ? (body.description.trim() || null)
      : existing.description;
  const photoUrl =
    typeof body.photoUrl === "string"
      ? (body.photoUrl.slice(0, 4_000_000) || null)
      : existing.photoUrl;

  const person = await prisma.person.update({
    where: { id },
    data: { name, relationship, nickname, phoneNumber, description, photoUrl },
  });

  return Response.json({ person });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const ctx = await getApiCareSession();
  if (!ctx) return unauthenticated();
  const { id } = await params;

  const person = await prisma.person.findFirst({
    where: { id, patientId: ctx.profile.id },
  });
  if (!person) {
    return Response.json({ error: "Person not found." }, { status: 404 });
  }

  await prisma.person.delete({ where: { id } });
  return Response.json({ ok: true });
}