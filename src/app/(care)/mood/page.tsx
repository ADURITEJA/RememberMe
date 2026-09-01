"use client";

/**
 * Mood Page — "How are you feeling?"
 *
 * Big 5 emoji MoodPicker buttons + optional note -> POST /api/moods
 * Gentle thank-you + "We're here for you" guidance.
 * Extra reassurance for sad/worried/confused with gentle SOS link.
 */

import { useState } from "react";
import { Smile, Heart, Sun, CloudRain, Sparkles, AlertCircle, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import MoodPicker, { MOOD_CHOICES, type MoodKey } from "@/components/care/MoodPicker";
import { cn } from "@/lib/utils";

const REASSURANCE: Record<MoodKey, { icon: React.ReactNode; title: string; message: string }> = {
  Happy: {
    icon: <Sparkles aria-hidden className="h-8 w-8 text-remme-amber" />,
    title: "That&apos;s wonderful to hear! 💛",
    message: "Hold onto this feeling. Moments like these are worth remembering.",
  },
  Fine: {
    icon: <Sun aria-hidden className="h-8 w-8 text-remme-amber" />,
    title: "Steady and calm — that&apos;s beautiful. 💛",
    message: "A peaceful day is a gift. Thank you for sharing it with me.",
  },
  Sad: {
    icon: <CloudRain aria-hidden className="h-8 w-8 text-remme-sage" />,
    title: "It&apos;s okay to feel sad sometimes. 💛",
    message:
      "You don&apos;t have to carry it alone. The people who love you want to be there for you. Would you like to let them know?",
  },
  Worried: {
    icon: <AlertCircle aria-hidden className="h-8 w-8 text-remme-status-attention" />,
    title: "It&apos;s okay to worry. You&apos;re safe right now. 💛",
    message:
      "Take a slow breath. You&apos;re not alone — help is close if you need it.",
  },
  Confused: {
    icon: <HelpCircle aria-hidden className="h-8 w-8 text-remme-sage" />,
    title: "Feeling confused is scary, but you&apos;re not alone. 💛",
    message:
      "It&apos;s okay to not have all the answers right now. Remma is here to help you find your way, step by gentle step.",
  },
};

export default function MoodPage() {
  const [selected, setSelected] = useState<MoodKey | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!selected) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/moods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mood: selected, note: note.trim() || undefined }),
      });
      if (!res.ok) throw new Error("Couldn&apos;t save mood");
      setSaved(true);
    } catch {
      setError("Sorry, we couldn&apos;t save that. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  if (saved && selected) {
    const reassure = REASSURANCE[selected];
    return (
      <div className="flex flex-col items-center gap-6 px-4 py-8 max-w-xl mx-auto">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-remme-sage/12 text-remme-sage-deep">
          {reassure.icon}
        </div>
        <h1 className="text-2xl font-semibold leading-tight text-center text-remme-ink">
          {reassure.title}
        </h1>
        <p className="max-w-lg text-lg leading-relaxed text-center text-remme-ink/75">
          {reassure.message}
        </p>

        {["Sad", "Worried", "Confused"].includes(selected) && (
          <div className="glass-panel flex flex-col gap-3 p-5 rounded-3xl max-w-md w-full border border-remme-sage/20">
            <p className="text-base text-remme-ink/70">
              If things feel like too much, you can always tap the button below —
              we&apos;ll alert the people who care about you right away.
            </p>
            <a href="/sos">
              <Button variant="danger" size="lg" className="min-touch gap-2">
                <AlertCircle aria-hidden className="h-5 w-5" /> Need help now
              </Button>
            </a>
          </div>
        )}

        <Button
          variant="sage"
          size="lg"
          className="min-touch"
          onClick={() => {
            setSaved(false);
            setSelected(null);
            setNote("");
          }}
        >
          <Heart aria-hidden className="h-5 w-5 mr-2" /> Check in again later
        </Button>

        <p className="text-sm text-remme-ink/50 text-center max-w-md">
          Your mood is saved privately — only you and the people you choose can see
          it. 💛
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 px-4 py-8 max-w-2xl mx-auto">
      {/* Header */}
      <section className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-caretitle font-semibold leading-tight tracking-tight text-remme-ink">
          How are you feeling?
        </h1>
        <p className="max-w-xl text-caresubtitle leading-snug text-remme-ink/70">
          Pick the face that matches right now. There&apos;s no wrong answer — just
          your truth.
        </p>
      </section>

      {/* Mood picker */}
      <MoodPicker
        selected={selected}
        onSelect={(key) => {
          setSelected(key);
          setError(null);
        }}
        disabled={busy}
      />

      {/* Optional note */}
      <section className="glass-card flex flex-col gap-3 p-5">
        <label htmlFor="mood-note" className="text-lg font-semibold text-remme-ink">
          Want to add a little note? (optional)
        </label>
        <textarea
          id="mood-note"
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="A few words about what&apos;s on your mind…"
          disabled={busy}
          className="w-full min-h-24 rounded-2xl border-2 border-remme-sage/15 bg-white/80 px-5 py-3 text-lg text-remme-ink placeholder:text-remme-ink/40 focus:border-remme-sage focus:outline-none focus:ring-4 focus:ring-remme-sage/25 resize-none"
        />
      </section>

      {error && (
        <p role="alert" className="rounded-xl bg-remme-status-emergency/10 px-4 py-3 text-lg font-medium text-remme-status-emergency text-center">
          {error}
        </p>
      )}

      <Button
        onClick={handleSave}
        variant="sage"
        size="xl"
        disabled={!selected || busy}
        isLoading={busy}
        className="min-touch"
      >
        <Smile aria-hidden className="h-6 w-6 mr-2" /> Save how I feel
      </Button>

      <p className="text-sm text-center text-remme-ink/50 max-w-md">
        This stays between us unless you choose to share it. Your caregivers only
        see it if you want them to. 💛
      </p>
    </div>
  );
}