"use client";

/**
 * MemoryTimelineCard — a big, friendly glass card for the memories timeline.
 *
 * Large photo at the top, calm typography, Listen and Speak helpers for voice
 * memories. The card is the whole visual unit used on `/care/memories`.
 */

import { useState } from "react";
import { CalendarDays, Mic, Volume2, VolumeX, MapPin, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useTextToSpeech } from "@/components/care/voice";

function prettyDate(date: string | Date | null | undefined): string {
  if (!date) return "";
  try {
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

export interface TimelineMemory {
  id: string;
  title: string;
  description?: string | null;
  date: string | Date;
  location?: string | null;
  media?: Array<{ id?: string; type?: string; url?: string }>;
  transcript?: { text?: string | null } | null;
}

export default function MemoryTimelineCard({ memory }: { memory: TimelineMemory }) {
  const { speak, cancel, isSpeaking } = useTextToSpeech();
  const [speaking, setSpeaking] = useState(false);

  const photos = memory.media?.filter((m) => m.type === "PHOTO" && m.url) ?? [];
  const voices = memory.media?.filter((m) => m.type === "VOICE" && m.url) ?? [];
  const mainPhoto = photos[0]?.url;
  const voiceUrl = voices[0]?.url;
  const transcriptText = memory.transcript?.text?.trim() || "";

  const readAloudText =
    `${memory.title}. ${memory.description ?? ""} ${transcriptText ? ` You once said: "${transcriptText}"` : ""}`.trim();

  const toggleListen = () => {
    if (speaking || isSpeaking) {
      cancel();
      setSpeaking(false);
      return;
    }
    setSpeaking(true);
    speak(readAloudText, { rate: 0.92 });
  };

  return (
    <Card variant="glass" className="overflow-hidden p-0">
      {mainPhoto ? (
        <img
          src={mainPhoto}
          alt={memory.title}
          className="block h-64 w-full object-cover sm:h-72"
          loading="lazy"
          decoding="async"
        />
      ) : null}
      <div className="flex flex-col gap-4 p-5 sm:p-7">
        {/* Date row */}
        <div className="flex flex-wrap items-center gap-2 text-sm text-remme-ink/55">
          <CalendarDays aria-hidden className="h-5 w-5" />
          <span>{prettyDate(memory.date)}</span>
          {memory.location ? (
            <>
              <span aria-hidden>·</span>
              <span className="inline-flex items-center gap-1">
                <MapPin aria-hidden className="h-4 w-4" />
                {memory.location}
              </span>
            </>
          ) : null}
        </div>

        {/* Title */}
        <h3 className="text-3xl font-semibold leading-tight text-remme-ink">
          {memory.title}
        </h3>

        {/* Description */}
        {memory.description ? (
          <p className="text-[1.15rem] leading-relaxed text-remme-ink/85">
            {memory.description}
          </p>
        ) : null}

        {/* Voice + transcript section */}
        {transcriptText || voiceUrl ? (
          <div className="glass-solid mt-1 flex flex-col gap-3 rounded-2xl p-4">
            {transcriptText ? (
              <p className="flex gap-2 text-base italic leading-relaxed text-remme-ink/75">
                <Mic aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-remme-sage" />
                “{transcriptText}”
              </p>
            ) : null}
            {voiceUrl ? (
              <audio controls src={voiceUrl} className="w-full rounded-xl" preload="none">
                Your browser doesn&apos;t support audio playback.
              </audio>
            ) : null}
          </div>
        ) : null}

        {/* Actions */}
        <div className="mt-1 flex flex-wrap gap-2">
          <Button
            type="button"
            variant={speaking || isSpeaking ? "sage" : "outline"}
            size="default"
            onClick={toggleListen}
            className="min-touch"
            aria-label={
              speaking || isSpeaking
                ? `Stop reading aloud: ${memory.title}`
                : `Listen to memory aloud: ${memory.title}`
            }
          >
            {speaking || isSpeaking ? (
              <VolumeX aria-hidden className="mr-2 h-5 w-5" />
            ) : (
              <Volume2 aria-hidden className="mr-2 h-5 w-5" />
            )}
            {speaking || isSpeaking ? "Stop" : "Listen aloud"}
          </Button>
          <span className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-remme-sage/10 px-4 py-2 text-sm font-medium text-remme-sage-deep">
            <Heart aria-hidden className="h-4 w-4" /> Saved with care
          </span>
        </div>
      </div>
    </Card>
  );
}
