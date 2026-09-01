"use client";

import { useState } from "react";
import { ToggleLeft, ToggleRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ZoneToggle({ zoneId, isActive }: { zoneId: string; isActive: boolean }) {
  const [active, setActive] = useState(isActive);
  const [busy, setBusy] = useState(false);

  const toggle = async () => {
    setBusy(true);
    try {
      await fetch("/api/location", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ zoneId, isActive: !active }),
      });
      setActive(!active);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      disabled={busy}
      aria-label={active ? "Deactivate zone" : "Activate zone"}
    >
      {active ? (
        <ToggleRight aria-hidden className="h-5 w-5 text-remme-sage" />
      ) : (
        <ToggleLeft aria-hidden className="h-5 w-5 text-remme-ink/40" />
      )}
    </Button>
  );
}
