import { NextRequest } from "next/server";
import { startOfDay, endOfDay } from "date-fns";
import { prisma } from "@/lib/prisma";
import {
  getApiCaregiverSession,
  unauthenticated,
} from "@/components/caregiver/caregiver-db";

/**
 * Caregiver reminder actions for a single reminder.
 * PATCH — either mark today's occurrence done/undone ({ completed: true|false })
 *         OR update editable fields ({ title, time, category, ... }).
 * DELETE — remove a reminder (occurrences cascade).
 */

async function findReminder(id: string, caregiverId: string) {
  return prisma.reminder.findFirst({
    where: {
      id,
      patient: { caregivers: { some: { caregiverId } } },
    },
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const ctx = await getApiCaregiverSession();
  if (!ctx) return unauthenticated();
  const { id } = await params;

  const reminder = await findReminder(id, ctx.userId);
  if (!reminder) {
    return Response.json({ error: "Reminder not found." }, { status: 404 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  // Mark today's occurrence done / pending.
  if (typeof body.completed === "boolean") {
    const now = new Date();
    const dayStart = startOfDay(now);
    const dayEnd = endOfDay(now);
    const today = await prisma.reminderOccurrence.findFirst({
      where: { reminderId: reminder.id, scheduledFor: { gte: dayStart, lte: dayEnd } },
    });

    if (body.completed) {
      if (today) {
        await prisma.reminderOccurrence.update({
          where: { id: today.id },
          data: { status: "COMPLETED", completedAt: now },
        });
      } else {
        await prisma.reminderOccurrence.create({
          data: { reminderId: reminder.id, scheduledFor: now, status: "COMPLETED", completedAt: now },
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
    return Response.json({ ok: true, completed: body.completed });
  }

  // Update editable fields.
  const data: { title?: string; time?: string; category?: string; recurrence?: string; description?: string | null } = {};
  if (typeof body.title === "string" && body.title.trim()) data.title = body.title.trim();
  if (typeof body.time === "string" && /^\d{2}:\d{2}$/.test(body.time)) data.time = body.time;
  if (typeof body.category === "string" && body.category.trim()) data.category = body.category.trim();
  if (typeof body.recurrence === "string" && body.recurrence.trim()) data.recurrence = body.recurrence.trim();
  if (typeof body.description === "string") data.description = body.description.trim() || null;

  if (Object.keys(data).length === 0) {
    return Response.json({ error: "Nothing to update." }, { status: 400 });
  }

  await prisma.reminder.update({ where: { id: reminder.id }, data });
  return Response.json({ ok: true, id: reminder.id });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const ctx = await getApiCaregiverSession();
  if (!ctx) return unauthenticated();
  const { id } = await params;

  const reminder = await findReminder(id, ctx.userId);
  if (!reminder) {
    return Response.json({ error: "Reminder not found." }, { status: 404 });
  }

  await prisma.reminder.delete({ where: { id: reminder.id } });
  return Response.json({ ok: true });
}
