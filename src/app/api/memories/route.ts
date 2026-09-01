import { NextRequest } from "next/server";
import {
  getApiCareSession,
  unauthenticated,
} from "@/components/care/care-db";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/memories — timeline (reverse chronological).
 *   Returns each memory with its media + voice transcript so the timeline can
 *   render photo, description and playback controls without a second roundtrip.
 *
 * POST /api/memories — share a memory. The linked Memory with photo + voice
 *   recording + transcript are created atomically (a single nested prisma
 *   create) so the memory is always one whole thing: Share-a-memory = one
 *   Memory with photo + voice + transcript held together.
 */
export async function GET() {
  const ctx = await getApiCareSession();
  if (!ctx) return unauthenticated();

  const memories = await prisma.memory.findMany({
    where: { patientId: ctx.profile.id },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    include: {
      media: { orderBy: { createdAt: "asc" } },
      transcript: true,
    },
  });

  return Response.json({
    memories: memories.map((m) => ({
      id: m.id,
      title: m.title,
      description: m.description,
      date: m.date.toISOString(),
      location: m.location,
      createdAt: m.createdAt.toISOString(),
      media: m.media.map((x) => ({
        id: x.id,
        type: x.type,
        url: x.url,
      })),
      transcript: m.transcript?.text ? { text: m.transcript.text } : null,
    })),
  });
}

const MAX_URL_LEN = 4_000_000;

export async function POST(request: NextRequest) {
  const ctx = await getApiCareSession();
  if (!ctx) return unauthenticated();

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Please send a valid memory." }, { status: 400 });
  }

  const title = typeof body.title === "string" ? body.title.trim() : "";
  const description =
    typeof body.description === "string" ? body.description.trim() : "";
  const location =
    typeof body.location === "string" ? body.location.trim() : "";
  const dateStr = typeof body.date === "string" ? body.date.trim() : "";
  const photoDataUrl = typeof body.photoDataUrl === "string" ? body.photoDataUrl.trim() : "";
  const voiceDataUrl = typeof body.voiceDataUrl === "string" ? body.voiceDataUrl.trim() : "";
  const transcriptText =
    typeof body.transcriptText === "string" ? body.transcriptText.trim() : "";

  if (!title) {
    return Response.json({ error: "Please give your memory a name — even a short one." }, { status: 400 });
  }

  const date = dateStr ? new Date(dateStr) : new Date();
  if (Number.isNaN(date.getTime())) {
    return Response.json({ error: "That date doesn't look right — please check it." }, { status: 400 });
  }

  // The memory should have SOMETHING to remember — photo, description, or voice
  if (!photoDataUrl && !description && !voiceDataUrl && !transcriptText) {
    return Response.json(
      { error: "Please share at least a little about what happened." },
      { status: 400 },
    );
  }

  const photo = photoDataUrl ? photoDataUrl.slice(0, MAX_URL_LEN) : null;
  const voice = voiceDataUrl ? voiceDataUrl.slice(0, MAX_URL_LEN) : null;
  const transcript = transcriptText ? transcriptText.slice(0, 20_000) : null;

  const memory = await prisma.memory.create({
    data: {
      patientId: ctx.profile.id,
      title,
      description: description || null,
      date,
      location: location || null,
      ...(transcript
        ? { transcript: { create: { text: transcript } } }
        : {}),
      ...(photo || voice
        ? {
            media: {
              create: [
                ...(photo ? [{ type: "PHOTO" as const, url: photo }] : []),
                ...(voice ? [{ type: "VOICE" as const, url: voice }] : []),
              ],
            },
          }
        : {}),
    },
    include: { media: true, transcript: true },
  });

  return Response.json(
    {
      memory: {
        id: memory.id,
        title: memory.title,
        description: memory.description,
        date: memory.date.toISOString(),
        location: memory.location,
        media: memory.media.map((m) => ({ id: m.id, type: m.type, url: m.url.slice(0, 22) })),
        transcript: memory.transcript?.text ? { chars: memory.transcript.text.length } : null,
      },
    },
    { status: 201 },
  );
}