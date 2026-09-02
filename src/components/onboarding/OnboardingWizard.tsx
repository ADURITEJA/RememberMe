"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { HeartHandshake, Users, CalendarDays, AlertCircle, CheckCircle2, ArrowRight, X } from "lucide-react";

const STORAGE_KEY = "remme_onboarding_complete";

const STEPS = [
  {
    icon: HeartHandshake,
    title: "Welcome to Remme 💛",
    body: "I'm here to help you stay on track with your daily routines, medications, and keep you connected with the people who care about you.",
    color: "bg-[#0071e3]/10 text-[#0071e3]",
  },
  {
    icon: Users,
    title: "Your Caregiver",
    body: "A trusted family member or caregiver can see your routines and check in on you. They'll help keep things running smoothly.",
    color: "bg-[#0071e3]/10 text-[#0071e3]",
  },
  {
    icon: CalendarDays,
    title: "Your Daily Routine",
    body: "Tap 'Routine' to see what's ahead today — morning, afternoon, and evening. Your caregiver sets these up for you.",
    color: "bg-[#0071e3]/10 text-[#0071e3]",
  },
  {
    icon: AlertCircle,
    title: "SOS — We're Here for You",
    body: "If you ever need help, tap the red SOS button at the top. We'll alert your caregiver and emergency contacts right away.",
    color: "bg-[#ff3b30]/10 text-[#ff3b30]",
  },
  {
    icon: CheckCircle2,
    title: "You're All Set! 🎉",
    body: "Tap any icon below to get started. Take it one step at a time — Remma is always here if you need a gentle nudge.",
    color: "bg-[#34c759]/10 text-[#34c759]",
  },
] as const;

export default function OnboardingWizard({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = React.useState(0);
  const current = STEPS[step];
  const Icon = current.icon;
  const isLast = step === STEPS.length - 1;

  function handleNext() {
    if (isLast) {
      try { localStorage.setItem(STORAGE_KEY, "1"); } catch {}
      onComplete();
    } else {
      setStep((s) => s + 1);
    }
  }

  function handleSkip() {
    try { localStorage.setItem(STORAGE_KEY, "1"); } catch {}
    onComplete();
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm"
      role="dialog"
      aria-label="Welcome wizard"
    >
      <div className="mx-4 w-full max-w-md rounded-[20px] bg-white/72 backdrop-blur-[20px] saturate-[180%] border border-[rgba(0,0,0,0.08)] p-8 shadow-[0_2px_12px_0_rgba(0,0,0,0.06),0_8px_32px_0_rgba(0,0,0,0.04)]">
        {/* Close / Skip */}
        <div className="mb-6 flex justify-end">
          {!isLast && (
            <button
              onClick={handleSkip}
              className="min-touch rounded-[980px] px-3 py-1.5 text-sm font-medium text-[#86868b] hover:text-[#1d1d1f] hover:bg-[#f5f5f7] transition-all duration-200"
            >
              Skip
            </button>
          )}
        </div>

        {/* Icon */}
        <div className={`mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full ${current.color}`}>
          <Icon aria-hidden className="h-10 w-10" strokeWidth={1.5} />
        </div>

        {/* Content */}
        <h2 className="mb-3 text-center text-2xl font-semibold text-[#1d1d1f] tracking-tight">
          {current.title}
        </h2>
        <p className="text-center text-base leading-relaxed text-[#86868b]">
          {current.body}
        </p>

        {/* Progress dots */}
        <div className="mt-8 flex justify-center gap-2" aria-hidden>
          {STEPS.map((_, i) => (
            <span
              key={i}
              className={`h-2 rounded-full transition-all duration-300 ${i === step ? "w-6 bg-[#0071e3]" : "w-2 bg-[#0071e3]/25"}`}
            />
          ))}
        </div>

        {/* Next / Done button */}
        <div className="mt-8">
          <Button
            onClick={handleNext}
            size="xl"
            className="min-touch w-full gap-2"
          >
            {isLast ? "Get Started" : "Next"}
            {!isLast && <ArrowRight aria-hidden className="h-5 w-5" />}
            {isLast && <CheckCircle2 aria-hidden className="h-5 w-5" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
