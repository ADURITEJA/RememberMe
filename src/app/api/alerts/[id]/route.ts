import { NextRequest } from "next/server";
import {
  getApiCaregiverSession,
  unauthenticated,
} from "@/components/caregiver/caregiver-db";
import { prisma } from "@/lib/prisma";

/**
 * PATCH /api/alerts/[id] — mark an alert read/unread. Body: { isRead }.
 *
 * DELETE /api/alerts/[id] — dismiss (delete) an alert.
 *
 * Both are scoped to the caregiver's linked patients.
 */

async function guardAlert(alertId: string) {
  const session = await getApiCaregiverSession();
  if (!session) return { session: null as null };
  const alert = await prisma.alert.findUnique({ where: { id: alertId } });
  if (!alert) return { session, notFound: true as true };
  if (!session.patients.some((p) => p.id === alert.patientId)) {
    return { session, forbidden: true as true };
  }
  return { session, alert };
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const guard = await guardAlert(id);
  if (!guard.session) return unauthenticated();
  if ("notFound" in guard) return Response.json({ error: "Alert not found." }, { status: 404 });
  if ("forbidden" in guard) {
    return Response.json({ error: "Not your patient." }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Please send a valid JSON body." }, { status: 400 });
  }

  const isRead = body.isRead === true;
  const alert = await prisma.alert.update({ where: { id }, data: { isRead } });
  return Response.json({ alert });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const guard = await guardAlert(id);
  if (!guard.session) return unauthenticated();
  if ("notFound" in guard) return Response.json({ error: "Alert not found." }, { status: 404 });
  if ("forbidden" in guard) {
    return Response.json({ error: "Not your patient." }, { status: 403 });
  }

  await prisma.alert.delete({ where: { id } });
  return Response.json({ ok: true });
}
