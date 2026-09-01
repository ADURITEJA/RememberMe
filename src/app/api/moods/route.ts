import { NextRequest } from "next/server";
import { getApiCareSession, unauthenticated } from "@/components/care/care-db";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/moods — Save a mood check-in.
 *
 * Body: { mood: string, note?: string }
 * Mood values: "Happy" | "Sad" | "Fine" | "Worried" | "Confused"
 * Creates a MoodCheckIn for the patient.
 */
export async function POST(request: NextRequest) {
  const ctx = await getApiCareSession();
  if (!ctx) return unauthenticated();

  let body: { mood?: string; note?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const validMoods = ["Happy", "Sad", "Fine", "Worried", "Confused"] as const;
  const mood = body.mood;
  if (!mood || !validMoods.includes(mood as (typeof validMoods)[number])) {
    return Response.json({ error: "Please pick a valid mood." }, { status: 400 });
  }

  const note = body.note?.trim().slice(0, 500) ?? null;

  await prisma.moodCheckIn.create({
    data: {
      patientId: ctx.profile.id,
      mood: mood as string,
      note,
    },
  });

  return Response.json({ ok: true });
}

/**
 * GET /api/moods — Get recent mood check-ins for display.
 */
export async function GET() {
  const ctx = await getApiCareSession();
  if (!ctx) return unauthenticated();

  const moods = await prisma.moodCheckIn.findMany({
    where: { patientId: ctx.profile.id },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  return Response.json({ moods });
}