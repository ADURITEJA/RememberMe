import Link from "next/link";
import { Images, Plus, Sparkles } from "lucide-react";
import { requireCareSession } from "@/components/care/care-db";
import { prisma } from "@/lib/prisma";
import EmptyState from "@/components/care/EmptyState";
import MemoryTimelineCard, { type TimelineMemory } from "@/components/care/MemoryTimelineCard";
import { Button } from "@/components/ui/button";

export const metadata = { title: "My memories — Remme Care" };

/**
 * Section 4 — My Memories: a reverse-chronological timeline of glass cards.
 * Each card shows photo + title + date + mood, with listen-back (TTS) and
 * voice playback from the stored transcript + recording.
 */
export default async function MemoriesPage() {
  const ctx = await requireCareSession();

  const memories = await prisma.memory.findMany({
    where: { patientId: ctx.profile.id },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    include: {
      media: { orderBy: { createdAt: "asc" } },
      transcript: true,
    },
  });

  const timeline: TimelineMemory[] = memories.map((m) => ({
    id: m.id,
    title: m.title,
    description: m.description,
    date: m.date,
    location: m.location,
    media: m.media.map((x) => ({ id: x.id, type: x.type, url: x.url })),
    transcript: m.transcript?.text ? { text: m.transcript.text } : null,
  }));

  return (
    <div className="flex flex-col gap-8">
      {/* Hero */}
      <section className="glass-panel flex flex-col gap-4 p-6 sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-2">
            <h1 className="text-caretitle font-semibold leading-tight text-remme-ink">
              My memories
            </h1>
            <p className="max-w-xl text-caresubtitle leading-snug text-remme-ink/70">
              Little lights from your life — saved exactly as you remember them.
            </p>
          </div>
          <Link href="/memories/new" className="hidden shrink-0 sm:block">
            <Button variant="sage" size="lg" className="gap-2 min-touch">
              <Plus aria-hidden className="h-6 w-6" /> Share a memory
            </Button>
          </Link>
        </div>
      </section>

      {/* Timeline */}
      {timeline.length === 0 ? (
        <EmptyState
          icon={<Images aria-hidden className="h-10 w-10" />}
          title="Your memories are safe in your heart"
          message="When you're ready, share one — a photo, a voice note, a moment. Remme keeps it for both of you. 💛"
          action={
            <Link href="/memories/new">
              <Button variant="sage" size="lg" className="mt-1 gap-2 min-touch">
                <Plus aria-hidden className="h-5 w-5" /> Share your first memory
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="flex flex-col gap-6">
          {timeline.map((memory) => (
            <MemoryTimelineCard key={memory.id} memory={memory} />
          ))}
        </div>
      )}

      {/* Mobile share button */}
      <Link href="/memories/new" className="sm:hidden">
        <Button variant="sage" size="xl" className="w-full gap-2 min-touch">
          <Sparkles aria-hidden className="h-6 w-6" /> Share a memory
        </Button>
      </Link>

      {timeline.length > 0 ? (
        <p className="text-center text-base text-remme-ink/50">
          Every memory stays yours — always here, always gentle.
        </p>
      ) : null}
    </div>
  );
}