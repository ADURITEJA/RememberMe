import { NextRequest } from "next/server";
import {
  getApiCareSession,
  unauthenticated,
} from "@/components/care/care-db";
import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay } from "date-fns";
import { generateMissedMedicationAlert } from "@/lib/medication-alerts";

/**
 * GET /api/medications — patient's active medications + today's log status.
 *
 * POST /api/medications — log a dose (TAKEN or SKIPPED).
 */
export async function GET() {
  const ctx = await getApiCareSession();
  if (!ctx) return unauthenticated();

  const now = new Date();
  const dayStart = startOfDay(now);
  const dayEnd = endOfDay(now);

  const medications = await prisma.medication.findMany({
    where: { patientId: ctx.profile.id, isActive: true },
    orderBy: { createdAt: "asc" },
    include: {
      logs: {
        where: {
          scheduledFor: { gte: dayStart, lte: dayEnd },
        },
        take: 1,
        orderBy: { scheduledFor: "asc" },
      },
    },
  });

  return Response.json({
    medications: medications.map((m) => ({
      id: m.id,
      name: m.name,
      dosage: m.dosage,
      instructions: m.instructions,
      imageUrl: m.imageUrl,
      frequency: m.frequency,
      times: m.times,
      refillDate: m.refillDate,
      log: m.logs[0]
        ? { id: m.logs[0].id, status: m.logs[0].status, takenAt: m.logs[0].takenAt }
        : null,
    })),
  });
}

export async function POST(request: NextRequest) {
  const ctx = await getApiCareSession();
  if (!ctx) return unauthenticated();

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Please send a valid request." }, { status: 400 });
  }

  const medicationId = typeof body.medicationId === "string" ? body.medicationId : "";
  const status = typeof body.status === "string" ? body.status.toUpperCase() : "";

  if (!medicationId) {
    return Response.json({ error: "Please specify which medication." }, { status: 400 });
  }
  if (status !== "TAKEN" && status !== "SKIPPED") {
    return Response.json({ error: "Status must be TAKEN or SKIPPED." }, { status: 400 });
  }

  // Verify the medication belongs to this patient
  const medication = await prisma.medication.findFirst({
    where: { id: medicationId, patientId: ctx.profile.id },
  });
  if (!medication) {
    return Response.json({ error: "Medication not found." }, { status: 404 });
  }

  // Create a log entry for today's dose
  const now = new Date();
  const scheduledFor = startOfDay(now);
  // Use the first scheduled time from the medication
  const firstTime = medication.times.split(",")[0]?.trim() || "09:00";
  const [h, m] = firstTime.split(":").map(Number);
  scheduledFor.setHours(h, m, 0, 0);

  try {
    await prisma.medicationLog.upsert({
      where: {
        medicationId_scheduledFor: { medicationId, scheduledFor },
      },
      update: {
        status,
        takenAt: now,
      },
      create: {
        medicationId,
        scheduledFor,
        status,
        takenAt: now,
      },
    });

    // Fire-and-forget: create alert + notification for missed/skipped doses
    if (status === "SKIPPED") {
      generateMissedMedicationAlert(medicationId, scheduledFor).catch(console.error);
    }
  } catch {
    return Response.json({ error: "Could not log dose. Please try again." }, { status: 500 });
  }

  return Response.json({ ok: true, status });
}
