"use server";

import { revalidatePath } from "next/cache";
import { getCaregiverSession } from "@/components/caregiver/caregiver-db";
import { prisma } from "@/lib/prisma";

/**
 * Caregiver management actions over a patient's Important Places.
 * Guard-railed to the caregiver's own linked patients.
 */

async function guard(patientId: string): Promise<string | null> {
  const session = await getCaregiverSession();
  if (!session) return "Please sign in first.";
  if (!patientId || !session.patients.some((p) => p.id === patientId)) {
    return "You're not linked to that patient.";
  }
  return null;
}

export async function createPlace(
  patientId: string,
  input: { name: string; address: string; contactNumber?: string; notes?: string },
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const guardErr = await guard(patientId);
  if (guardErr) return { ok: false, error: guardErr };

  const name = input.name.trim();
  const address = input.address.trim();
  if (!name) return { ok: false, error: "Give the place a name." };
  if (!address) return { ok: false, error: "An address is required." };

  const place = await prisma.importantPlace.create({
    data: {
      patientId,
      name,
      address,
      contactNumber: input.contactNumber?.trim() || null,
      notes: input.notes?.trim() || null,
    },
  });

  revalidatePath("/caregiver/places");
  return { ok: true, id: place.id };
}

export async function updatePlace(
  patientId: string,
  placeId: string,
  input: { name?: string; address?: string; contactNumber?: string; notes?: string },
): Promise<{ ok: true } | { ok: false; error: string }> {
  const guardErr = await guard(patientId);
  if (guardErr) return { ok: false, error: guardErr };

  const existing = await prisma.importantPlace.findFirst({ where: { id: placeId, patientId } });
  if (!existing) return { ok: false, error: "Place not found." };

  const name = input.name?.trim() || existing.name;
  const address = input.address?.trim() || existing.address;
  if (!name) return { ok: false, error: "Give the place a name." };
  if (!address) return { ok: false, error: "An address is required." };

  await prisma.importantPlace.update({
    where: { id: placeId },
    data: {
      name,
      address,
      contactNumber: input.contactNumber !== undefined ? (input.contactNumber.trim() || null) : existing.contactNumber,
      notes: input.notes !== undefined ? (input.notes.trim() || null) : existing.notes,
    },
  });

  revalidatePath("/caregiver/places");
  return { ok: true };
}

export async function deletePlace(
  patientId: string,
  placeId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const guardErr = await guard(patientId);
  if (guardErr) return { ok: false, error: guardErr };

  const existing = await prisma.importantPlace.findFirst({ where: { id: placeId, patientId } });
  if (!existing) return { ok: false, error: "Place not found." };

  await prisma.importantPlace.delete({ where: { id: placeId } });

  revalidatePath("/caregiver/places");
  return { ok: true };
}
