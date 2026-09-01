import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getApiCaregiverSession,
  resolvePatientId,
  unauthenticated,
} from "@/components/caregiver/caregiver-db";
import { isInsideZone } from "@/lib/geo";

/**
 * GET /api/location?patient=<profileId>
 * Returns the patient's last LocationPing, their SafetyZones (each annotated
 * with the inside/outside verdict for the last ping), and recent ZoneEvents.
 *
 * PATCH — toggle a SafetyZone's active flag.
 * Body: { zoneId, isActive }
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

  const [lastPing, zones, events] = await Promise.all([
    prisma.locationPing.findFirst({
      where: { patientId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.safetyZone.findMany({ where: { patientId }, orderBy: { name: "asc" } }),
    prisma.zoneEvent.findMany({
      where: { zone: { patientId } },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { zone: { select: { id: true, name: true } } },
    }),
  ]);

  const point = lastPing ? { lat: lastPing.lat, lng: lastPing.lng } : null;

  const annotatedZones = zones.map((z) => ({
    id: z.id,
    name: z.name,
    lat: z.lat,
    lng: z.lng,
    radius: z.radius,
    isActive: z.isActive,
    activeHours: z.activeHours,
    status: isInsideZone(point, z),
  }));

  return Response.json({
    lastPing: lastPing
      ? {
          id: lastPing.id,
          lat: lastPing.lat,
          lng: lastPing.lng,
          accuracy: lastPing.accuracy,
          battery: lastPing.battery,
          createdAt: lastPing.createdAt.toISOString(),
        }
      : null,
    zones: annotatedZones,
    events: events.map((e) => ({
      id: e.id,
      type: e.type,
      zoneId: e.zoneId,
      zoneName: e.zone.name,
      createdAt: e.createdAt.toISOString(),
    })),
    inAnyZone: zones.some((z) => point && isInsideZone(point, z) === "INSIDE"),
  });
}

export async function PATCH(request: NextRequest) {
  const ctx = await getApiCaregiverSession();
  if (!ctx) return unauthenticated();

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const zoneId = body.zoneId as string;
  if (!zoneId || typeof body.isActive !== "boolean") {
    return Response.json({ error: "zoneId and isActive are required." }, { status: 400 });
  }

  const zone = await prisma.safetyZone.findFirst({
    where: { id: zoneId, patient: { caregivers: { some: { caregiverId: ctx.userId } } } },
  });
  if (!zone) {
    return Response.json({ error: "Safety zone not found." }, { status: 404 });
  }

  await prisma.safetyZone.update({
    where: { id: zone.id },
    data: { isActive: body.isActive },
  });

  return Response.json({ ok: true, id: zone.id, isActive: body.isActive });
}
