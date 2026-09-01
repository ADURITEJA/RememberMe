import { NextRequest } from "next/server";
import { getApiCareSession, unauthenticated, mockPushNotification } from "@/components/care/care-db";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/sos — Create an SOS alert and notify emergency contacts.
 *
 * Body: { confirmed: boolean, note?: string }
 * On confirmed=true: creates Alert(type="SOS"), logs mock push, returns emergency contacts for calling.
 */

export async function POST(request: NextRequest) {
  const ctx = await getApiCareSession();
  if (!ctx) return unauthenticated();

  let body: { confirmed?: boolean; note?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!body.confirmed) {
    return Response.json({ error: "SOS requires explicit confirmation." }, { status: 400 });
  }

  const profileId = ctx.profile.id;

  // Create the SOS alert
  const alert = await prisma.alert.create({
    data: {
      patientId: profileId,
      type: "SOS",
      message: body.note ? `SOS: ${body.note}` : "Emergency SOS triggered",
    },
  });

  // Get emergency contacts for the calm "help is on the way" screen
  const contacts = await prisma.emergencyContact.findMany({
    where: { patientId: profileId },
    orderBy: { order: "asc" },
  });

  // Mock push notification to caregiver(s) — swap for real provider when service lands
  await mockPushNotification(
    "🚨 Remme SOS Alert",
    `${ctx.userName} needs help right now. ${body.note ? `Note: ${body.note}` : ""}`,
  );

  return Response.json({
    alertId: alert.id,
    message: "Help is on the way.",
    contacts: contacts.map((c) => ({
      id: c.id,
      name: c.name,
      phoneNumber: c.phoneNumber,
      relationship: c.relationship,
      order: c.order,
    })),
  });
}