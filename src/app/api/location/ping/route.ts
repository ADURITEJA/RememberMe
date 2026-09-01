import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAllZones, isInsideZone } from "@/lib/geo";
import {
  getApiCaregiverSession,
  unauthenticated,
} from "@/components/caregiver/caregiver-db";
import { notify } from "@/lib/services/notifications";

/**
 * POST /api/location/ping
 * Simulates a live device ping from the patient's device.
 * Body: { patientId, lat, lng, accuracy?, battery? }
 *
 * It records a LocationPing, then compares the new point with the previous
 * one against the patient's SafetyZones to detect ENTRY / EXIT transitions:
 *   - EXIT  -> writes a ZONE_EXIT Alert + EXIT ZoneEvent + a notification
 *   - ENTRY -> writes an ENTRY ZoneEvent
 *
 * This powers the "Demo simulation" toggle on the Location page.
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

  const requestedPatientId = body.patientId as string | undefined;
  const linked = ctx.patients.some((p) => p.id === requestedPatientId);
  const patientId = linked ? (requestedPatientId as string) : ctx.patients[0]?.id;
  if (!patientId) {
    return Response.json({ error: "No linked patient." }, { status: 400 });
  }

  const lat = Number(body.lat);
  const lng = Number(body.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return Response.json(
      { error: "A valid lat and lng are required." },
      { status: 400 },
    );
  }

  const [previousPing, zones, patient] = await Promise.all([
    prisma.locationPing.findFirst({
      where: { patientId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.safetyZone.findMany({ where: { patientId } }),
    prisma.careProfile.findUnique({
      where: { id: patientId },
      include: { user: { select: { name: true } } },
    }),
  ]);

  const point = { lat, lng };
  const current = checkAllZones(point, zones);
  const currentZone = current.zone;
  const prevInside =
    previousPing && currentZone
      ? isInsideZone(
          { lat: previousPing.lat, lng: previousPing.lng },
          currentZone,
        ) === "INSIDE"
      : null;

  const newPing = await prisma.locationPing.create({
    data: {
      patientId,
      lat,
      lng,
      accuracy: Number.isFinite(Number(body.accuracy)) ? Number(body.accuracy) : null,
      battery: Number.isFinite(Number(body.battery)) ? Number(body.battery) : null,
    },
  });

  const patientName = patient?.user?.name?.split(" ")[0] || "Your loved one";
  let transition: "EXIT" | "ENTRY" | null = null;

  if (currentZone) {
    if (prevInside === true && current.inside === false) {
      transition = "EXIT";
      await prisma.zoneEvent.create({
        data: { zoneId: currentZone.id as string, pingId: newPing.id, type: "EXIT" },
      });
      const message = `${patientName} left the ${currentZone.name} safety zone.`;
      const alert = await prisma.alert.create({
        data: {
          patientId,
          targetUserId: ctx.userId,
          type: "ZONE_EXIT",
          message,
        },
      });
      await notify({
        title: "Safety zone exit",
        body: message,
        type: "ZONE_EXIT",
        patientId,
        targetUserId: ctx.userId,
      });
      void alert;
    } else if (prevInside === false && current.inside === true) {
      transition = "ENTRY";
      await prisma.zoneEvent.create({
        data: { zoneId: currentZone.id as string, pingId: newPing.id, type: "ENTRY" },
      });
    }
  }

  return Response.json({
    ok: true,
    pingId: newPing.id,
    lat,
    lng,
    createdAt: newPing.createdAt.toISOString(),
    insideZone: current.inside,
    closestZone: currentZone?.name ?? null,
    distanceM: current.distanceM,
    transition,
  });
}
