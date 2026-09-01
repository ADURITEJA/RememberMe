"use client";

/**
 * ShareMemoryForm — the "Share a memory" flow (the heart of Care Mode).
 *
 * One memory held together: photo + description ("What happened?") + voice
 * recording linked to a MemoryTranscript. Voice input auto-fills the text area
 * AND keeps the raw transcript + audio for playback. Saving creates the whole
 * memory atomically through POST /api/memories.
 *
 * Voice recording is safe to ignore: the form works perfectly with just a
 * photo or some text.
 */

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Camera,
  ImagePlus,
  ArrowLeft,
  CheckCircle2,
  MapPin,
  Heart,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { readCarePhoto } from "@/components/care/photo-upload";
import VoiceRecorder from "@/components/care/VoiceRecorder";

const inputClass =
  "w-full min-h-14 rounded-2xl border-2 border-remme-sage/15 bg-white/80 px-5 py-3 text-xl text-remme-ink placeholder:text-remme-ink/40 focus:border-remme-sage focus:outline-none focus:ring-4 focus:ring-remme-sage/25";

export default function ShareMemoryForm() {
  const router = useRouter();
  const [photo, setPhoto] = useState<string>("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [date, setDate] = useState("");
  const [voiceDataUrl, setVoiceDataUrl] = useState("");
  const [transcriptText, setTranscriptText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhoto = async (file: File | null) => {
    if (!file) return;
    try {
      const result = await readCarePhoto(file);
      if (result) {
        setPhoto(result.dataUrl);
        setError(null);
      } else {
        setError("That doesn't look like a photo — please choose a picture.");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't read that photo.");
    }
  };

  const handleTranscribe = (finalText: string) => {
    // Auto-fill the "What happened?" box with what the person said, and keep
    // the raw transcript for storage + playback.
    setDescription((prev) => (prev.trim() ? prev + " " : "") + finalText.trim());
    setTranscriptText((prev) => (prev.trim() ? prev + " " : "") + finalText.trim());
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setError(null);

    if (!title.trim()) {
      setError("Please give your memory a name — even a short one.");
      return;
    }
    if (!photo && !description.trim() && !voiceDataUrl && !transcriptText) {
      setError("Please share at least a little about what happened — a photo, a few words, or a voice note.");
      return;
    }

    setBusy(true);
    try {
      const res = await fetch("/api/memories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          location: location.trim(),
          date: date || new Date().toISOString().slice(0, 10),
          photoDataUrl: photo,
          voiceDataUrl,
          transcriptText,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Sorry, we couldn't save that memory. Please try again.");
        setBusy(false);
        return;
      }
      setSavedId(data.memory?.id ?? null);
      setBusy(false);
    } catch {
      setError("Sorry, we couldn't reach the server. Please try again.");
      setBusy(false);
    }
  };

  // Success screen
  if (savedId) {
    return (
      <div className="glass-panel flex flex-col items-center gap-5 p-8 text-center">
        <span className="flex h-24 w-24 items-center justify-center rounded-full bg-remme-sage/12 text-remme-sage">
          <CheckCircle2 aria-hidden className="h-14 w-14" />
        </span>
        <h2 className="text-3xl font-semibold leading-tight text-remme-ink">
          Beautiful — your memory is safe.
        </h2>
        <p className="max-w-lg text-xl leading-relaxed text-remme-ink/75">
          We&apos;ll keep it here, just the two of us, so you can visit it whenever
          you like. 💛
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            variant="sage"
            size="lg"
            className="gap-2 min-touch"
            onClick={() => {
              router.push("/care/memories");
              router.refresh();
            }}
          >
            <Heart aria-hidden className="h-5 w-5" /> See my memories
          </Button>
          <Button
            variant="glass"
            size="lg"
            className="min-touch"
            onClick={() => {
              setSavedId(null);
              setTitle("");
              setDescription("");
              setLocation("");
              setDate("");
              setPhoto("");
              setVoiceDataUrl("");
              setTranscriptText("");
            }}
          >
            Share another
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="flex flex-col gap-6"
      aria-label="Share a memory"
    >
      {/* Photo picker */}
      <section className="flex flex-col items-center gap-3">
        {photo ? (
          <img
            src={photo}
            alt="Your memory"
            className="h-56 w-full max-w-sm rounded-3xl object-cover shadow-glass sm:h-64"
          />
        ) : (
          <label
            className="flex min-h-56 w-full max-w-sm cursor-pointer flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-remme-sage/30 bg-remme-sage/5 p-8 text-center transition-colors hover:border-remme-sage/60 hover:bg-remme-sage/10"
            htmlFor="memory-photo"
          >
            <Camera aria-hidden className="h-12 w-12 text-remme-sage" />
            <span className="text-xl font-medium text-remme-ink">
              Add a photo
            </span>
            <span className="text-base text-remme-ink/55">
              Take a picture or choose one from your gallery
            </span>
          </label>
        )}
        <div className="flex flex-wrap justify-center gap-2">
          {photo ? (
            <Button
              type="button"
              variant="outline"
              size="default"
              onClick={() => fileInputRef.current?.click()}
              className="gap-2 min-touch"
            >
              <ImagePlus aria-hidden className="h-5 w-5" /> Change photo
            </Button>
          ) : null}
          {photo ? (
            <Button
              type="button"
              variant="ghost"
              size="default"
              onClick={() => setPhoto("")}
              className="min-touch"
            >
              Remove
            </Button>
          ) : null}
        </div>
        <input
          ref={fileInputRef}
          id="memory-photo"
          name="photo"
          type="file"
          accept="image/*"
          className="sr-only"
          aria-label="Choose a photo for your memory"
          onChange={(e) => handlePhoto(e.target.files?.[0] ?? null)}
        />
      </section>

      {/* Title */}
      <section className="flex flex-col gap-2">
        <label htmlFor="memory-title" className="text-lg font-semibold text-remme-ink">
          What should we call this memory?
        </label>
        <input
          id="memory-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Our day at the park"
          autoComplete="off"
          className={inputClass}
        />
      </section>

      {/* What happened + voice */}
      <section className="glass-card flex flex-col gap-4 p-5 sm:p-6">
        <label htmlFor="memory-description" className="text-lg font-semibold text-remme-ink">
          What happened? Tell me about it.
        </label>
        <textarea
          id="memory-description"
          rows={5}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="We sat by the pond and fed the ducks… or tap the microphone and say it."
          className={cn(inputClass, "resize-none leading-relaxed")}
        />
        <VoiceRecorder
          onTranscribe={handleTranscribe}
          onAudio={(url) => setVoiceDataUrl(url)}
        />
        <p className="flex items-center gap-2 text-sm text-remme-ink/50">
          <Sparkles aria-hidden className="h-4 w-4 text-remme-sage" />
          Whatever you say out loud is saved with this memory, so you can hear it again.
        </p>
      </section>

      {/* When + where */}
      <section className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label htmlFor="memory-date" className="text-lg font-semibold text-remme-ink">
            When was it?
          </label>
          <input
            id="memory-date"
            type="date"
            value={date}
            max={new Date().toISOString().slice(0, 10)}
            onChange={(e) => setDate(e.target.value)}
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="memory-location" className="text-lg font-semibold text-remme-ink">
            Where were we?
          </label>
          <div className="relative">
            <MapPin
              aria-hidden
              className="pointer-events-none absolute left-4 top-1/2 h-6 w-6 -translate-y-1/2 text-remme-sage/50"
            />
            <input
              id="memory-location"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="At the seaside"
              className={cn(inputClass, "pl-13")}
            />
          </div>
        </div>
      </section>

      {error ? (
        <p
          role="alert"
          className="rounded-xl bg-remme-status-emergency/10 px-4 py-3 text-lg font-medium text-remme-status-emergency"
        >
          {error}
        </p>
      ) : null}

      <div className="flex items-center justify-between gap-3">
        <Link
          href="/memories"
          className="inline-flex min-h-12 items-center gap-2 rounded-xl px-4 text-lg font-medium text-remme-ink/60 hover:bg-black/5"
        >
          <ArrowLeft aria-hidden className="h-5 w-5" /> Back
        </Link>
        <Button type="submit" variant="sage" size="xl" isLoading={busy} className="min-touch">
          <Heart aria-hidden className="mr-2 h-6 w-6" /> Save this memory
        </Button>
      </div>
    </form>
  );
}