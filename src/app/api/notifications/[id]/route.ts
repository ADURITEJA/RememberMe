import { NextRequest } from "next/server";
import {
  getApiCareSession,
  unauthenticated,
} from "@/components/care/care-db";
import { prisma } from "@/lib/prisma";

/**
 * PATCH /api/notifications/[id] — mark a notification as read.
 * Body: { isRead: boolean }.
 *
 * DELETE /api/notifications/[id] — dismiss (delete) a notification.
 *
 * Both are scoped to the patient who owns the notification.
 */

async function guardNotification(notificationId: string) {
  const ctx = await getApiCareSession();
  if (!ctx) return { ctx: null as null };
  const notification = await prisma.notification.findUnique({
    where: { id: notificationId },
  });
  if (!notification) return { ctx, notFound: true as true };
  if (notification.patientId !== ctx.profile.id) {
    return { ctx, forbidden: true as true };
  }
  return { ctx, notification };
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const guard = await guardNotification(id);
  if (!guard.ctx) return unauthenticated();
  if ("notFound" in guard) {
    return Response.json({ error: "Notification not found." }, { status: 404 });
  }
  if ("forbidden" in guard) {
    return Response.json({ error: "Not your notification." }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Please send a valid JSON body." }, { status: 400 });
  }

  const isRead = body.isRead === true;
  const notification = await prisma.notification.update({
    where: { id },
    data: { isRead },
  });
  return Response.json({ notification });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const guard = await guardNotification(id);
  if (!guard.ctx) return unauthenticated();
  if ("notFound" in guard) {
    return Response.json({ error: "Notification not found." }, { status: 404 });
  }
  if ("forbidden" in guard) {
    return Response.json({ error: "Not your notification." }, { status: 403 });
  }

  await prisma.notification.delete({ where: { id } });
  return Response.json({ ok: true });
}
