"use server";

import { revalidatePath } from "next/cache";
import { getCaregiverSession } from "@/components/caregiver/caregiver-db";
import { prisma } from "@/lib/prisma";

/**
 * Caregiver management actions over a patient's Routines and Routine Steps.
 *
 * Guard-railed: every action verifies the session AND that `patientId` is
 * actually linked to the caregiver, so they can only touch patients they
 * genuinely care for.
 */

async function guard(patientId: string): Promise<string | null> {
  const session = await getCaregiverSession();
  if (!session) return "Please sign in first.";
  if (!patientId || !session.patients.some((p) => p.id === patientId)) {
    return "You're not linked to that patient.";
  }
  return null;
}

/* ------------------------------------------------------------------ *
 *  Routine CRUD
 * ------------------------------------------------------------------ */

export async function createRoutine(
  patientId: string,
  input: { name: string },
): Promise<{ ok: true } | { ok: false; error: string }> {
  const guardErr = await guard(patientId);
  if (guardErr) return { ok: false, error: guardErr };

  const name = input.name.trim();
  if (!name) return { ok: false, error: "Give the routine a name." };

  await prisma.routine.create({
    data: { patientId, name, isActive: true },
  });

  revalidatePath("/caregiver/routines");
  return { ok: true };
}

export async function updateRoutine(
  patientId: string,
  routineId: string,
  input: { name?: string; isActive?: boolean },
): Promise<{ ok: true } | { ok: false; error: string }> {
  const guardErr = await guard(patientId);
  if (guardErr) return { ok: false, error: guardErr };

  const existing = await prisma.routine.findFirst({ where: { id: routineId, patientId } });
  if (!existing) return { ok: false, error: "Routine not found." };

  const name = input.name?.trim() || existing.name;
  if (!name) return { ok: false, error: "Give the routine a name." };

  await prisma.routine.update({
    where: { id: routineId },
    data: {
      name,
      isActive: input.isActive ?? existing.isActive,
    },
  });

  revalidatePath("/caregiver/routines");
  return { ok: true };
}

export async function deleteRoutine(
  patientId: string,
  routineId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const guardErr = await guard(patientId);
  if (guardErr) return { ok: false, error: guardErr };

  const existing = await prisma.routine.findFirst({ where: { id: routineId, patientId } });
  if (!existing) return { ok: false, error: "Routine not found." };

  // Cascade: delete steps first (Prisma doesn't cascade on this relation)
  await prisma.routineStep.deleteMany({ where: { routineId } });
  await prisma.routine.delete({ where: { id: routineId } });

  revalidatePath("/caregiver/routines");
  return { ok: true };
}

/* ------------------------------------------------------------------ *
 *  Routine Step CRUD
 * ------------------------------------------------------------------ */

export async function addStep(
  patientId: string,
  routineId: string,
  input: { title: string; timeEst?: string | null },
): Promise<{ ok: true } | { ok: false; error: string }> {
  const guardErr = await guard(patientId);
  if (guardErr) return { ok: false, error: guardErr };

  const routine = await prisma.routine.findFirst({ where: { id: routineId, patientId } });
  if (!routine) return { ok: false, error: "Routine not found." };

  const title = input.title.trim();
  if (!title) return { ok: false, error: "Give the step a name." };

  // Compute next order index
  const lastStep = await prisma.routineStep.findFirst({
    where: { routineId },
    orderBy: { order: "desc" },
  });
  const nextOrder = (lastStep?.order ?? -1) + 1;

  await prisma.routineStep.create({
    data: {
      routineId,
      title,
      timeEst: input.timeEst?.trim() || null,
      order: nextOrder,
    },
  });

  revalidatePath("/caregiver/routines");
  return { ok: true };
}

export async function updateStep(
  patientId: string,
  stepId: string,
  input: { title?: string; timeEst?: string | null },
): Promise<{ ok: true } | { ok: false; error: string }> {
  const guardErr = await guard(patientId);
  if (guardErr) return { ok: false, error: guardErr };

  const step = await prisma.routineStep.findFirst({
    where: { id: stepId },
    include: { routine: true },
  });
  if (!step || step.routine.patientId !== patientId) {
    return { ok: false, error: "Step not found." };
  }

  const title = input.title?.trim() || step.title;
  if (!title) return { ok: false, error: "Give the step a name." };

  await prisma.routineStep.update({
    where: { id: stepId },
    data: {
      title,
      timeEst: input.timeEst !== undefined ? (input.timeEst?.trim() || null) : step.timeEst,
    },
  });

  revalidatePath("/caregiver/routines");
  return { ok: true };
}

export async function deleteStep(
  patientId: string,
  stepId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const guardErr = await guard(patientId);
  if (guardErr) return { ok: false, error: guardErr };

  const step = await prisma.routineStep.findFirst({
    where: { id: stepId },
    include: { routine: true },
  });
  if (!step || step.routine.patientId !== patientId) {
    return { ok: false, error: "Step not found." };
  }

  await prisma.routineStep.delete({ where: { id: stepId } });

  revalidatePath("/caregiver/routines");
  return { ok: true };
}

export async function reorderSteps(
  patientId: string,
  routineId: string,
  stepIds: string[],
): Promise<{ ok: true } | { ok: false; error: string }> {
  const guardErr = await guard(patientId);
  if (guardErr) return { ok: false, error: guardErr };

  const routine = await prisma.routine.findFirst({ where: { id: routineId, patientId } });
  if (!routine) return { ok: false, error: "Routine not found." };

  // Update order for each step in a transaction
  await prisma.$transaction(
    stepIds.map((id, index) =>
      prisma.routineStep.update({
        where: { id },
        data: { order: index },
      })
    ),
  );

  revalidatePath("/caregiver/routines");
  return { ok: true };
}
