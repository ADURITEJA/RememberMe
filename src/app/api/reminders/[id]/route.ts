import { NextRequest } from "next/server";
import {
  getApiCareSession,
  unauthenticated,
} from "@/components/care/care-db";
import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay } from "date-fns";

/**
 * PATCH /api/reminders/[id] — mark today's reminder done / not done.
 * This is the "did you take your pills?" flow: completing a daily reminder
 * writes a ReminderOccurrence (COMPLETED) against today, un-completing
 * reopens it.
 *
 * DELETE /api/reminders/[id] — delete a reminder (occurrences cascade).
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const ctx = await getApiCareSession();
  if (!ctx) return unauthenticated();
  const { id } = await params;

  const reminder = await prisma.reminder.findFirst({
    where: { id, patientId: ctx.profile.id },
  });
  if (!reminder) {
    return Response.json({ error: "Reminder not found." }, { status: 404 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Please send a valid form." }, { status: 400 });
  }
  const completed = body.completed === true;

  const now = new Date();
  const dayStart = startOfDay(now);
  const dayEnd = endOfDay(now);

  const today = await prisma.reminderOccurrence.findFirst({
    where: {
      reminderId: reminder.id,
      scheduledFor: { gte: dayStart, lte: dayEnd },
    },
  });

  if (completed) {
    if (today) {
      await prisma.reminderOccurrence.update({
        where: { id: today.id },
        data: { status: "COMPLETED", completedAt: now },
      });
    } else {
      await prisma.reminderOccurrence.create({
        data: {
          reminderId: reminder.id,
          scheduledFor: now,
          status: "COMPLETED",
          completedAt: now,
        },
      });
    }
  } else {
    if (today) {
      await prisma.reminderOccurrence.update({
        where: { id: today.id },
        data: { status: "PENDING", completedAt: null },
      });
    }
  }

  return Response.json({
    ok: true,
    reminderId: reminder.id,
    completed,
  });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const ctx = await getApiCareSession();
  if (!ctx) return unauthenticated();
  const { id } = await params;

  const reminder = await prisma.reminder.findFirst({
    where: { id, patientId: ctx.profile.id },
  });
  if (!reminder) {
    return Response.json({ error: "Reminder not found." }, { status: 404 });
  }

  await prisma.reminder.delete({ where: { id: reminder.id } });
  return Response.json({ ok: true });
}