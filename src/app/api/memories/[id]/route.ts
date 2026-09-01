import { NextRequest } from "next/server";
import {
  getApiCareSession,
  unauthenticated,
} from "@/components/care/care-db";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/memories/[id] — one memory incl. media + transcript, for playback.
 *
 * DELETE /api/memories/[id] — remove a memory and its media/transcript.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const ctx = await getApiCareSession();
  if (!ctx) return unauthenticated();
  const { id } = await params;

  const memory = await prisma.memory.findFirst({
    where: { id, patientId: ctx.profile.id },
    include: {
      media: { orderBy: { createdAt: "asc" } },
      transcript: true,
    },
  });

  if (!memory) {
    return Response.json({ error: "Memory not found." }, { status: 404 });
  }

  return Response.json({
    memory: {
      id: memory.id,
      title: memory.title,
      description: memory.description,
      date: memory.date.toISOString(),
      location: memory.location,
      createdAt: memory.createdAt.toISOString(),
      media: memory.media.map((m) => ({ id: m.id, type: m.type, url: m.url })),
      transcript: memory.transcript?.text ? { text: memory.transcript.text } : null,
    },
  });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const ctx = await getApiCareSession();
  if (!ctx) return unauthenticated();
  const { id } = await params;

  const memory = await prisma.memory.findFirst({
    where: { id, patientId: ctx.profile.id },
  });
  if (!memory) {
    return Response.json({ error: "Memory not found." }, { status: 404 });
  }

  await prisma.memory.delete({ where: { id } });
  return Response.json({ ok: true });
}