"use server";

import { revalidatePath } from "next/cache";
import { getCaregiverSession } from "@/components/caregiver/caregiver-db";
import { prisma } from "@/lib/prisma";

/**
 * Caregiver management actions over a patient's Reminders.
 *
 * These are guard-railed to the caregiver's own linked patients: every action
 * verifies the session AND that `patientId` is actually linked to them, so a
 * caregiver can only ever touch the people they genuinely care for.
 */

async function guard(patientId: string): Promise<string | null> {
  const session = await getCaregiverSession();
  if (!session) return "Please sign in first.";
  if (!patientId || !session.patients.some((p) => p.id === patientId)) {
    return "You're not linked to that patient.";
  }
  return null;
}

const CATEGORIES = ["Medication", "Meals", "Appointments", "Exercise", "Hydration", "General"];

export async function createReminder(
  patientId: string,
  input: {
    title: string;
    time: string;
    recurrence?: string;
    category?: string;
    description?: string;
  },
): Promise<{ ok: true } | { ok: false; error: string }> {
  const guardErr = await guard(patientId);
  if (guardErr) return { ok: false, error: guardErr };

  const title = input.title.trim();
  const time = input.time;
  if (!title) return { ok: false, error: "Give the reminder a name." };
  if (!/^\d{2}:\d{2}$/.test(time)) {
    return { ok: false, error: "Pick a valid time (HH:mm)." };
  }
  const recurrence =
    ["DAILY", "WEEKLY", "ONCE"].includes(input.recurrence ?? "") ? input.recurrence! : "DAILY";
  const category = CATEGORIES.includes(input.category ?? "")
    ? input.category!
    : (input.category?.trim() ? input.category!.trim() : "General");
  const description = input.description?.trim() || null;

  await prisma.reminder.create({
    data: { patientId, title, time, recurrence, category, description, isActive: true },
  });

  revalidatePath("/caregiver/reminders");
  return { ok: true };
}

export async function updateReminder(
  patientId: string,
  reminderId: string,
  input: {
    title?: string;
    time?: string;
    recurrence?: string;
    category?: string;
    description?: string;
    isActive?: boolean;
  },
): Promise<{ ok: true } | { ok: false; error: string }> {
  const guardErr = await guard(patientId);
  if (guardErr) return { ok: false, error: guardErr };

  const existing = await prisma.reminder.findFirst({ where: { id: reminderId, patientId } });
  if (!existing) return { ok: false, error: "Reminder not found." };

  const title = input.title?.trim() || existing.title;
  if (!title) return { ok: false, error: "Give the reminder a name." };
  if (input.time && !/^\d{2}:\d{2}$/.test(input.time)) {
    return { ok: false, error: "Pick a valid time (HH:mm)." };
  }

  await prisma.reminder.update({
    where: { id: reminderId },
    data: {
      title,
      time: input.time || existing.time,
      recurrence: input.recurrence || existing.recurrence,
      category: input.category || existing.category,
      description:
        input.description !== undefined
          ? (input.description.trim() || null)
          : existing.description,
      isActive: input.isActive ?? existing.isActive,
    },
  });

  revalidatePath("/caregiver/reminders");
  return { ok: true };
}

export async function toggleReminder(
  patientId: string,
  reminderId: string,
  isActive: boolean,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const guardErr = await guard(patientId);
  if (guardErr) return { ok: false, error: guardErr };
  const existing = await prisma.reminder.findFirst({ where: { id: reminderId, patientId } });
  if (!existing) return { ok: false, error: "Reminder not found." };

  await prisma.reminder.update({ where: { id: reminderId }, data: { isActive } });
  revalidatePath("/caregiver/reminders");
  return { ok: true };
}

export async function deleteReminder(
  patientId: string,
  reminderId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const guardErr = await guard(patientId);
  if (guardErr) return { ok: false, error: guardErr };
  const existing = await prisma.reminder.findFirst({ where: { id: reminderId, patientId } });
  if (!existing) return { ok: false, error: "Reminder not found." };

  await prisma.reminder.delete({ where: { id: reminderId } });
  revalidatePath("/caregiver/reminders");
  return { ok: true };
}
