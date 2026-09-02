"use server";

import { revalidatePath } from "next/cache";
import { getCaregiverSession } from "@/components/caregiver/caregiver-db";
import { prisma } from "@/lib/prisma";

/**
 * Caregiver management actions over a patient's Safety Zones.
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

export async function createZone(
  patientId: string,
  input: { name: string; lat: number; lng: number; radius: number },
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const guardErr = await guard(patientId);
  if (guardErr) return { ok: false, error: guardErr };

  const name = input.name.trim();
  if (!name) return { ok: false, error: "Give the zone a name." };
  if (input.radius < 50 || input.radius > 10000) {
    return { ok: false, error: "Radius must be between 50 and 10,000 meters." };
  }

  const zone = await prisma.safetyZone.create({
    data: {
      patientId,
      name,
      lat: input.lat,
      lng: input.lng,
      radius: input.radius,
      isActive: true,
    },
  });

  revalidatePath("/caregiver/location");
  return { ok: true, id: zone.id };
}

export async function updateZone(
  patientId: string,
  zoneId: string,
  input: { name?: string; lat?: number; lng?: number; radius?: number; isActive?: boolean },
): Promise<{ ok: true } | { ok: false; error: string }> {
  const guardErr = await guard(patientId);
  if (guardErr) return { ok: false, error: guardErr };

  const existing = await prisma.safetyZone.findFirst({ where: { id: zoneId, patientId } });
  if (!existing) return { ok: false, error: "Zone not found." };

  const name = input.name?.trim() || existing.name;
  if (!name) return { ok: false, error: "Give the zone a name." };

  if (input.radius !== undefined && (input.radius < 50 || input.radius > 10000)) {
    return { ok: false, error: "Radius must be between 50 and 10,000 meters." };
  }

  await prisma.safetyZone.update({
    where: { id: zoneId },
    data: {
      name,
      lat: input.lat ?? existing.lat,
      lng: input.lng ?? existing.lng,
      radius: input.radius ?? existing.radius,
      isActive: input.isActive ?? existing.isActive,
    },
  });

  revalidatePath("/caregiver/location");
  return { ok: true };
}

export async function deleteZone(
  patientId: string,
  zoneId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const guardErr = await guard(patientId);
  if (guardErr) return { ok: false, error: guardErr };

  const existing = await prisma.safetyZone.findFirst({ where: { id: zoneId, patientId } });
  if (!existing) return { ok: false, error: "Zone not found." };

  // Delete zone events first (no cascade)
  await prisma.zoneEvent.deleteMany({ where: { zoneId } });
  await prisma.safetyZone.delete({ where: { id: zoneId } });

  revalidatePath("/caregiver/location");
  return { ok: true };
}

export async function toggleZone(
  patientId: string,
  zoneId: string,
  isActive: boolean,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const guardErr = await guard(patientId);
  if (guardErr) return { ok: false, error: guardErr };

  const existing = await prisma.safetyZone.findFirst({ where: { id: zoneId, patientId } });
  if (!existing) return { ok: false, error: "Zone not found." };

  await prisma.safetyZone.update({
    where: { id: zoneId },
    data: { isActive },
  });

  revalidatePath("/caregiver/location");
  return { ok: true };
}
