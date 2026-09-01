import { NextRequest } from "next/server";
import {
  getApiCaregiverSession,
  unauthenticated,
} from "@/components/caregiver/caregiver-db";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/alerts?patient=<profileId>
 * List alerts for a caregiver's linked patient (newest first). When no
 * patient is given, aggregates alerts across all of the caregiver's patients.
 *
 * POST /api/alerts
 * Create a manual alert for a linked patient (e.g. a caregiver check-in note).
 * Body: { patientId, type?, message }
 */

export async function GET(request: NextRequest) {
  const session = await getApiCaregiverSession();
  if (!session) return unauthenticated();

  const patientId = request.nextUrl.searchParams.get("patient");

  if (patientId) {
    if (!session.patients.some((p) => p.id === patientId)) {
      return Response.json({ error: "You're not linked to that patient." }, { status: 403 });
    }
    const alerts = await prisma.alert.findMany({
      where: { patientId },
      orderBy: { createdAt: "desc" },
    });
    return Response.json({ alerts });
  }

  // Aggregate across linked patients (only seen patients).
  const alerts = await prisma.alert.findMany({
    where: { patientId: { in: session.patients.map((p) => p.id) } },
    orderBy: { createdAt: "desc" },
  });
  return Response.json({ alerts });
}

export async function POST(request: NextRequest) {
  const session = await getApiCaregiverSession();
  if (!session) return unauthenticated();

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Please send a valid JSON body." }, { status: 400 });
  }

  const patientId = typeof body.patientId === "string" ? body.patientId : "";
  if (!patientId || !session.patients.some((p) => p.id === patientId)) {
    return Response.json({ error: "You're not linked to that patient." }, { status: 403 });
  }
  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (!message) {
    return Response.json({ error: "An alert needs a message." }, { status: 400 });
  }
  const type = typeof body.type === "string" && body.type ? body.type : "MANUAL_NOTE";

  const alert = await prisma.alert.create({
    data: {
      patientId,
      targetUserId: session.userId,
      type,
      message,
      isRead: false,
    },
  });

  return Response.json({ alert }, { status: 201 });
}
