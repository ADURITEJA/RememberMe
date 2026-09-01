"use server";

import { revalidatePath } from "next/cache";
import { getCaregiverSession } from "@/components/caregiver/caregiver-db";
import { prisma } from "@/lib/prisma";

/**
 * Caregiver management actions over a patient's Medications.
 *
 * Guarded to the caregiver's own linked patients — every action verifies
 * the session AND that `patientId` is linked to them.
 */

async function guard(patientId: string): Promise<string | null> {
  const session = await getCaregiverSession();
  if (!session) return "Please sign in first.";
  if (!patientId || !session.patients.some((p) => p.id === patientId)) {
    return "You're not linked to that patient.";
  }
  return null;
}

const FREQUENCIES = ["DAILY", "WEEKLY", "AS_NEEDED"];

export async function createMedication(
  patientId: string,
  input: {
    name: string;
    dosage: string;
    instructions?: string;
    imageUrl?: string;
    frequency?: string;
    times?: string;
    refillDate?: string;
  },
): Promise<{ ok: true } | { ok: false; error: string }> {
  const guardErr = await guard(patientId);
  if (guardErr) return { ok: false, error: guardErr };

  const name = input.name.trim();
  const dosage = input.dosage.trim();
  if (!name) return { ok: false, error: "Give the medication a name." };
  if (!dosage) return { ok: false, error: "Enter the dosage (e.g. 1 tablet)." };

  const frequency = FREQUENCIES.includes(input.frequency ?? "")
    ? input.frequency!
    : "DAILY";
  const times = input.times?.trim() || "09:00";
  const instructions = input.instructions?.trim() || null;
  const imageUrl = input.imageUrl?.trim() || null;
  const refillDate = input.refillDate ? new Date(input.refillDate) : null;

  await prisma.medication.create({
    data: {
      patientId,
      name,
      dosage,
      instructions,
      imageUrl,
      frequency,
      times,
      refillDate,
      isActive: true,
    },
  });

  revalidatePath("/caregiver/medications");
  revalidatePath("/medications");
  return { ok: true };
}

export async function updateMedication(
  patientId: string,
  medicationId: string,
  input: {
    name?: string;
    dosage?: string;
    instructions?: string;
    imageUrl?: string;
    frequency?: string;
    times?: string;
    refillDate?: string;
  },
): Promise<{ ok: true } | { ok: false; error: string }> {
  const guardErr = await guard(patientId);
  if (guardErr) return { ok: false, error: guardErr };

  const existing = await prisma.medication.findFirst({
    where: { id: medicationId, patientId },
  });
  if (!existing) return { ok: false, error: "Medication not found." };

  const name = input.name?.trim() || existing.name;
  const dosage = input.dosage?.trim() || existing.dosage;
  if (!name) return { ok: false, error: "Give the medication a name." };
  if (!dosage) return { ok: false, error: "Enter the dosage." };

  await prisma.medication.update({
    where: { id: medicationId },
    data: {
      name,
      dosage,
      instructions:
        input.instructions !== undefined
          ? (input.instructions.trim() || null)
          : existing.instructions,
      imageUrl:
        input.imageUrl !== undefined
          ? (input.imageUrl.trim() || null)
          : existing.imageUrl,
      frequency: input.frequency || existing.frequency,
      times: input.times?.trim() || existing.times,
      refillDate: input.refillDate ? new Date(input.refillDate) : existing.refillDate,
    },
  });

  revalidatePath("/caregiver/medications");
  revalidatePath("/medications");
  return { ok: true };
}

export async function toggleMedication(
  patientId: string,
  medicationId: string,
  isActive: boolean,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const guardErr = await guard(patientId);
  if (guardErr) return { ok: false, error: guardErr };
  const existing = await prisma.medication.findFirst({
    where: { id: medicationId, patientId },
  });
  if (!existing) return { ok: false, error: "Medication not found." };

  await prisma.medication.update({
    where: { id: medicationId },
    data: { isActive },
  });

  revalidatePath("/caregiver/medications");
  revalidatePath("/medications");
  return { ok: true };
}

export async function deleteMedication(
  patientId: string,
  medicationId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const guardErr = await guard(patientId);
  if (guardErr) return { ok: false, error: guardErr };
  const existing = await prisma.medication.findFirst({
    where: { id: medicationId, patientId },
  });
  if (!existing) return { ok: false, error: "Medication not found." };

  await prisma.medication.delete({ where: { id: medicationId } });

  revalidatePath("/caregiver/medications");
  revalidatePath("/medications");
  return { ok: true };
}
