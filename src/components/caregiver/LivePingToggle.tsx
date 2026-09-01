"use client";

import { useState, useEffect, useRef } from "react";
import { Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LivePingToggle({ patientId }: { patientId: string }) {
  const [isLive, setIsLive] = useState(false);
  const [lastPing, setLastPing] = useState<{ lat: number; lng: number } | null>(null);
  const [events, setEvents] = useState<Array<{ id: string; type: string; createdAt: string }>>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetch(`/api/location?patient=${patientId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.lastPing) setLastPing({ lat: data.lastPing.lat, lng: data.lastPing.lng });
        if (data.events) setEvents(data.events);
      });
  }, [patientId]);

  const startLive = () => {
    if (intervalRef.current) return;
    intervalRef.current = setInterval(async () => {
      if (!lastPing) return;
      const jitter = () => (Math.random() - 0.5) * 0.002;
      const newLat = lastPing.lat + jitter();
      const newLng = lastPing.lng + jitter();
      const res = await fetch("/api/location/ping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientId, lat: newLat, lng: newLng, source: "DEMO" }),
      });
      if (res.ok) {
        const data = await res.json();
        setLastPing({ lat: newLat, lng: newLng });
        if (data.events?.length) setEvents((prev) => [...data.events, ...prev].slice(0, 10));
      }
    }, 5000);
    setIsLive(true);
  };

  const stopLive = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsLive(false);
  };

  useEffect(() => {
    return () => stopLive();
  }, []);

  return (
    <div className="flex items-center gap-3">
      <Button
        variant={isLive ? "danger" : "sage"}
        size="lg"
        onClick={isLive ? stopLive : startLive}
        className="min-touch gap-2"
      >
        {isLive ? <Pause aria-hidden className="h-5 w-5" /> : <Play aria-hidden className="h-5 w-5" />}
        {isLive ? "Stop demo ping" : "Start demo ping"}
      </Button>
      <span className="text-sm text-remme-ink/60 dark:text-remme-inklight/60">
        {isLive ? "🔴 Live demo simulation" : "Paused"}
      </span>
    </div>
  );
}
