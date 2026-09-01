"use client";

/**
 * MoodPicker — 5 big, friendly emoji buttons for the Mood page + Home.
 *
 * Large tap targets, high-contrast selection, readable labels. Saves the mood
 * to MoodCheckIn via the caller and shows a gentle confirmation.
 */

import { cn } from "@/lib/utils";

export const MOOD_CHOICES = [
  { key: "Happy", label: "Happy", emoji: "😊", note: "Light and bright" },
  { key: "Sad", label: "Sad", emoji: "😢", note: "A little down today" },
  { key: "Fine", label: "Fine", emoji: "🙂", note: "Steady and calm" },
  { key: "Worried", label: "Worried", emoji: "😟", note: "On my mind" },
  { key: "Confused", label: "Confused", emoji: "😕", note: "Need gentle help" },
] as const;

export type MoodKey = (typeof MOOD_CHOICES)[number]["key"];

interface MoodPickerProps {
  selected?: MoodKey | null;
  onSelect: (key: MoodKey) => void;
  disabled?: boolean;
}

export default function MoodPicker({ selected, onSelect, disabled }: MoodPickerProps) {
  return (
    <div
      className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5"
      role="radiogroup"
      aria-label="Mood"
    >
      {MOOD_CHOICES.map((mood) => {
        const active = selected === mood.key;
        return (
          <button
            key={mood.key}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={`${mood.label}: ${mood.note}`}
            disabled={disabled}
            onClick={() => onSelect(mood.key)}
            className={cn(
              "flex min-h-28 flex-col items-center justify-center gap-1 rounded-3xl border-2 p-4 text-center transition-all min-touch sm:min-h-32",
              active
                ? "border-remme-sage bg-remme-sage text-white shadow-glass"
                : "border-remme-sage/10 bg-white/75 text-remme-ink hover:bg-remme-sage/10 hover:border-remme-sage/40",
              "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-remme-sage/40",
            )}
          >
            <span className="text-4xl leading-none sm:text-5xl" aria-hidden>
              {mood.emoji}
            </span>
            <span className={cn("text-base font-semibold", active ? "text-white" : "text-remme-ink")}>
              {mood.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
