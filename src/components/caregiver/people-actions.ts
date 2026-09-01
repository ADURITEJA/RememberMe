"use server";

import { revalidatePath } from "next/cache";
import { getCaregiverSession } from "@/components/caregiver/caregiver-db";
import { prisma } from "@/lib/prisma";

/**
 * Caregiver management actions over a patient's People. Guard-railed to the
 * caregiver's own linked patients (see reminders-actions.ts for the pattern).
 */

async function guard(patientId: string): Promise<string | null> {
  const session = await getCaregiverSession();
  if (!session) return "Please sign in first.";
  if (!patientId || !session.patients.some((p) => p.id === patientId)) {
    return "You're not linked to that patient.";
  }
  return null;
}

export async function createPerson(
  patientId: string,
  input: {
    name: string;
    relationship: string;
    nickname?: string;
    phoneNumber?: string;
    description?: string;
    photoUrl?: string;
  },
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const guardErr = await guard(patientId);
  if (guardErr) return { ok: false, error: guardErr };
  const name = input.name.trim();
  if (!name) return { ok: false, error: "Give the person a name." };

  const person = await prisma.person.create({
    data: {
      patientId,
      name,
      relationship: input.relationship.trim() || "Friend",
      nickname: input.nickname?.trim() || null,
      phoneNumber: input.phoneNumber?.trim() || null,
      description: input.description?.trim() || null,
      photoUrl: input.photoUrl?.slice(0, 4_000_000) || null,
    },
  });

  revalidatePath("/caregiver/people");
  return { ok: true, id: person.id };
}

export async function updatePerson(
  patientId: string,
  personId: string,
  input: {
    name?: string;
    relationship?: string;
    nickname?: string;
    phoneNumber?: string;
    description?: string;
    photoUrl?: string;
  },
): Promise<{ ok: true } | { ok: false; error: string }> {
  const guardErr = await guard(patientId);
  if (guardErr) return { ok: false, error: guardErr };
  const existing = await prisma.person.findFirst({ where: { id: personId, patientId } });
  if (!existing) return { ok: false, error: "Person not found." };
  const name = input.name?.trim() || existing.name;
  if (!name) return { ok: false, error: "Give the person a name." };

  await prisma.person.update({
    where: { id: personId },
    data: {
      name,
      relationship: input.relationship !== undefined ? (input.relationship.trim() || "Friend") : existing.relationship,
      nickname: input.nickname !== undefined ? (input.nickname.trim() || null) : existing.nickname,
      phoneNumber: input.phoneNumber !== undefined ? (input.phoneNumber.trim() || null) : existing.phoneNumber,
      description: input.description !== undefined ? (input.description.trim() || null) : existing.description,
      photoUrl: input.photoUrl !== undefined ? (input.photoUrl.slice(0, 4_000_000) || null) : existing.photoUrl,
    },
  });

  revalidatePath("/caregiver/people");
  return { ok: true };
}

export async function deletePerson(
  patientId: string,
  personId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const guardErr = await guard(patientId);
  if (guardErr) return { ok: false, error: guardErr };
  const existing = await prisma.person.findFirst({ where: { id: personId, patientId } });
  if (!existing) return { ok: false, error: "Person not found." };

  await prisma.person.delete({ where: { id: personId } });
  revalidatePath("/caregiver/people");
  return { ok: true };
}
