"use server";

import { revalidatePath } from "next/cache";
import { getCaregiverSession } from "@/components/caregiver/caregiver-db";
import { prisma } from "@/lib/prisma";

/**
 * Caregiver management actions over a patient's Emergency Contacts.
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

export async function createEmergencyContact(
  patientId: string,
  input: { name: string; phoneNumber: string; relationship: string },
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const guardErr = await guard(patientId);
  if (guardErr) return { ok: false, error: guardErr };

  const name = input.name.trim();
  const phoneNumber = input.phoneNumber.trim();
  if (!name) return { ok: false, error: "Give the contact a name." };
  if (!phoneNumber) return { ok: false, error: "A phone number is required." };

  // Compute next order index
  const lastContact = await prisma.emergencyContact.findFirst({
    where: { patientId },
    orderBy: { order: "desc" },
  });
  const nextOrder = (lastContact?.order ?? -1) + 1;

  const contact = await prisma.emergencyContact.create({
    data: {
      patientId,
      name,
      phoneNumber,
      relationship: input.relationship.trim() || "Contact",
      order: nextOrder,
    },
  });

  revalidatePath("/caregiver/emergency-contacts");
  revalidatePath("/caregiver/sos");
  return { ok: true, id: contact.id };
}

export async function updateEmergencyContact(
  patientId: string,
  contactId: string,
  input: { name?: string; phoneNumber?: string; relationship?: string },
): Promise<{ ok: true } | { ok: false; error: string }> {
  const guardErr = await guard(patientId);
  if (guardErr) return { ok: false, error: guardErr };

  const existing = await prisma.emergencyContact.findFirst({ where: { id: contactId, patientId } });
  if (!existing) return { ok: false, error: "Contact not found." };

  const name = input.name?.trim() || existing.name;
  const phoneNumber = input.phoneNumber?.trim() || existing.phoneNumber;
  if (!name) return { ok: false, error: "Give the contact a name." };
  if (!phoneNumber) return { ok: false, error: "A phone number is required." };

  await prisma.emergencyContact.update({
    where: { id: contactId },
    data: {
      name,
      phoneNumber,
      relationship: input.relationship !== undefined ? (input.relationship.trim() || "Contact") : existing.relationship,
    },
  });

  revalidatePath("/caregiver/emergency-contacts");
  return { ok: true };
}

export async function deleteEmergencyContact(
  patientId: string,
  contactId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const guardErr = await guard(patientId);
  if (guardErr) return { ok: false, error: guardErr };

  const existing = await prisma.emergencyContact.findFirst({ where: { id: contactId, patientId } });
  if (!existing) return { ok: false, error: "Contact not found." };

  await prisma.emergencyContact.delete({ where: { id: contactId } });

  revalidatePath("/caregiver/emergency-contacts");
  return { ok: true };
}

export async function reorderEmergencyContacts(
  patientId: string,
  contactIds: string[],
): Promise<{ ok: true } | { ok: false; error: string }> {
  const guardErr = await guard(patientId);
  if (guardErr) return { ok: false, error: guardErr };

  await prisma.$transaction(
    contactIds.map((id, index) =>
      prisma.emergencyContact.update({
        where: { id },
        data: { order: index },
      })
    ),
  );

  revalidatePath("/caregiver/emergency-contacts");
  return { ok: true };
}
