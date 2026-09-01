import { NextRequest } from "next/server";
import {
  getApiCareSession,
  unauthenticated,
} from "@/components/care/care-db";
import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay } from "date-fns";

/**
 * GET /api/reminders — my reminders, each annotated with today's completion
 * state (from today's ReminderOccurrence).
 *
 * POST /api/reminders — create a new friendly reminder.
 */
export async function GET() {
  const ctx = await getApiCareSession();
  if (!ctx) return unauthenticated();

  const now = new Date();
  const dayStart = startOfDay(now);
  const dayEnd = endOfDay(now);

  const reminders = await prisma.reminder.findMany({
    where: { patientId: ctx.profile.id },
    orderBy: [{ time: "asc" }, { createdAt: "asc" }],
    include: {
      occurrences: {
        where: {
          scheduledFor: { gte: dayStart, lte: dayEnd },
        },
        take: 1,
        orderBy: { scheduledFor: "asc" },
      },
    },
  });

  return Response.json({
    reminders: reminders.map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      time: r.time,
      recurrence: r.recurrence,
      category: r.category,
      icon: r.icon,
      isActive: r.isActive,
      completed: r.occurrences[0]?.status === "COMPLETED",
      created: r.createdAt,
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
    return Response.json({ error: "Please send a valid form." }, { status: 400 });
  }

  const title = typeof body.title === "string" ? body.title.trim() : "";
  const time =
    typeof body.time === "string" && /^\d{2}:\d{2}$/.test(body.time) ? body.time : "";
  const recurrence = typeof body.recurrence === "string" ? body.recurrence : "DAILY";
  const category = typeof body.category === "string" ? body.category : "General";
  const description = typeof body.description === "string" ? body.description.trim() : "";

  if (!title) {
    return Response.json({ error: "Please give your reminder a name." }, { status: 400 });
  }
  if (!time) {
    return Response.json({ error: "Please pick a time for the reminder." }, { status: 400 });
  }

  const reminder = await prisma.reminder.create({
    data: {
      patientId: ctx.profile.id,
      title,
      description: description || null,
      time,
      recurrence,
      category,
      isActive: true,
    },
  });

  // A brand-new reminder immediately gets today's occurrence so the
  // "did you take your pills?" flow can complete it today.
  const [hour, minute] = time.split(":").map(Number);
  const scheduledFor = startOfDay(new Date());
  scheduledFor.setHours(hour, minute, 0, 0);

  try {
    await prisma.reminderOccurrence.create({
      data: {
        reminderId: reminder.id,
        scheduledFor,
        status: "PENDING",
      },
    });
  } catch {
    /* the reminder still exists even if scheduling hiccups */
  }

  return Response.json({ reminder: { id: reminder.id, title: reminder.title } }, { status: 201 });
}