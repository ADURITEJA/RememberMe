"use client";

import * as React from "react";
import OnboardingWizard from "./OnboardingWizard";

const STORAGE_KEY = "remme_onboarding_complete";

export default function OnboardingGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = React.useState(false);
  const [showWizard, setShowWizard] = React.useState(false);

  React.useEffect(() => {
    try {
      const done = localStorage.getItem(STORAGE_KEY);
      if (!done) setShowWizard(true);
    } catch {}
    setReady(true);
  }, []);

  function handleComplete() {
    setShowWizard(false);
  }

  // Don't render anything until localStorage is checked
  if (!ready) return null;

  return (
    <>
      {showWizard && <OnboardingWizard onComplete={handleComplete} />}
      {children}
    </>
  );
}