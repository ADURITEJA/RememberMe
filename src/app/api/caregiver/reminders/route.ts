import { NextRequest } from "next/server";
import { startOfDay, endOfDay } from "date-fns";
import { prisma } from "@/lib/prisma";
import {
  getApiCaregiverSession,
  resolvePatientId,
  unauthenticated,
} from "@/components/caregiver/caregiver-db";

/**
 * GET /api/caregiver/reminders?patient=<profileId>
 * Returns every active Reminder for the active patient, each with
 * today's ReminderOccurrence (if any) so the page can show done / pending.
 */
export async function GET(request: NextRequest) {
  const ctx = await getApiCaregiverSession();
  if (!ctx) return unauthenticated();

  const patientId = resolvePatientId(
    request.nextUrl.searchParams.get("patient") ?? undefined,
    ctx.patients,
  );
  if (!patientId) {
    return Response.json({ error: "No linked patient." }, { status: 404 });
  }

  const now = new Date();
  const dayStart = startOfDay(now);
  const dayEnd = endOfDay(now);

  const reminders = await prisma.reminder.findMany({
    where: { patientId, isActive: true },
    orderBy: [{ time: "asc" }, { createdAt: "asc" }],
    include: {
      occurrences: {
        where: { scheduledFor: { gte: dayStart, lte: dayEnd } },
        take: 1,
        orderBy: { scheduledFor: "asc" },
      },
    },
  });

  const rows = reminders.map((r) => ({
    id: r.id,
    title: r.title,
    description: r.description,
    time: r.time,
    recurrence: r.recurrence,
    category: r.category,
    createdAt: r.createdAt.toISOString(),
    todayStatus: (r.occurrences[0]?.status ?? "PENDING") as string,
    todayOccurrenceId: r.occurrences[0]?.id ?? null,
  }));

  return Response.json({ reminders: rows });
}

/**
 * POST /api/caregiver/reminders
 * Body: { patientId, title, time, category, recurrence?, description? }
 */
export async function POST(request: NextRequest) {
  const ctx = await getApiCaregiverSession();
  if (!ctx) return unauthenticated();

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const patientId = resolvePatientId(
    body.patientId as string | undefined,
    ctx.patients,
  );
  if (!patientId) {
    return Response.json(
      { error: "Please select a patient to add a reminder for." },
      { status: 400 },
    );
  }

  const title = (body.title as string)?.trim();
  const time = (body.time as string)?.trim();
  if (!title || !time) {
    return Response.json(
      { error: "A title and time are required.", fieldErrors: { title: !title ? "Required" : undefined, time: !time ? "Required" : undefined } },
      { status: 400 },
    );
  }
  if (!/^\d{2}:\d{2}$/.test(time)) {
    return Response.json(
      { error: "Time must be in HH:mm format.", fieldErrors: { time: "Use 24h HH:mm, e.g. 14:30" } },
      { status: 400 },
    );
  }

  const reminder = await prisma.reminder.create({
    data: {
      patientId,
      title,
      description: (body.description as string)?.trim() || null,
      time,
      recurrence: (body.recurrence as string)?.trim() || "DAILY",
      category: (body.category as string)?.trim() || "General",
    },
  });

  return Response.json({ ok: true, id: reminder.id }, { status: 201 });
}
