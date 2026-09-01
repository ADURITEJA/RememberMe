"use client";

import * as React from "react";
import { MapPin, Home } from "lucide-react";
import { haversineDistance } from "@/lib/geo";

export interface MockMapPoint {
  lat: number;
  lng: number;
  label?: string;
  isZoneCenter?: boolean;
  radius?: number;
}

/**
 * MOCK_MAP — a calm, purpose-built static "map" fallback that renders a
 * stylised radar/grid backdrop (no external tiles or API keys). It visualises
 * a list of points on a blurred sage grid and draws zone radius rings.
 *
 * Coordinates are normalised to fit the box; this is a demo map, not
 * cartographically accurate — which is fine for a caregiver overview.
 */
export function MOCK_MAP({
  points,
  className,
  height = 280,
}: {
  points: MockMapPoint[];
  className?: string;
  height?: number;
}) {
  const svgRef = React.useRef<SVGSVGElement | null>(null);
  const [box, setBox] = React.useState({ w: 800, h: 400 });

  React.useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.width > 0) setBox({ w: rect.width, h: rect.height });
  }, [height]);

  // Normalise lat/lng to the box with padding.
  const pad = 56;
  if (points.length === 0) {
    return (
      <div
        style={{ height }}
        className={`flex w-full items-center justify-center rounded-3xl bg-remme-sage/8 text-lg text-remme-ink/55 ${className ?? ""}`}
      >
        No location to show
      </div>
    );
  }

  const lats = points.map((p) => p.lat);
  const lngs = points.map((p) => p.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  const span = Math.max(maxLat - minLat, maxLng - minLng, 0.001);
  const scaleX = (box.w - pad * 2) / span;
  const scaleY = (box.h - pad * 2) / span;

  const px = (p: MockMapPoint) => {
    const x = pad + (p.lng - minLng) * scaleX;
    // Invert Y so that north (higher lat) is upward.
    const y = pad + (maxLat - p.lat) * scaleY;
    return [x, y] as const;
  };

  return (
    <div
      style={{ height }}
      className={`relative w-full overflow-hidden rounded-3xl border border-remme-sage/15 ${className ?? ""}`}
    >
      {/* Warm artifact backdrop */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 100% at 20% 10%, rgba(91,140,114,0.10), transparent 60%), radial-gradient(100% 80% at 85% 90%, rgba(232,169,76,0.10), transparent 55%), linear-gradient(135deg, #e9e4da, #f4f0e8)",
        }}
      />
      <svg
        ref={svgRef}
        viewBox={`0 0 ${box.w} ${box.h}`}
        className="relative h-full w-full"
        role="img"
        aria-label="Static location sketch"
      >
        {/* Grid */}
        <g stroke="rgba(38,48,43,0.06)" strokeWidth="1">
          {Array.from({ length: 7 }).map((_, i) => {
            const x = (box.w / 7) * (i + 1);
            const y = (box.h / 7) * (i + 1);
            return (
              <React.Fragment key={i}>
                <line x1={x} y1={0} x2={x} y2={box.h} />
                <line x1={0} y1={y} x2={box.w} y2={y} />
              </React.Fragment>
            );
          })}
        </g>

        {/* Zone radius rings */}
        {points
          .filter((p) => p.isZoneCenter && p.radius)
          .map((p, i) => {
            const [cx, cy] = px(p);
            const ringPx = Math.max((p.radius ?? 300) * 0.18, 30);
            return (
              <circle
                key={`ring-${i}`}
                cx={cx}
                cy={cy}
                r={ringPx}
                fill="rgba(91,140,114,0.10)"
                stroke="rgba(91,140,114,0.35)"
                strokeWidth="2"
                strokeDasharray="6 6"
              />
            );
          })}

        {/* Distance lines from zone center to latest ping */}
        {points
          .filter((p) => p.isZoneCenter)
          .map((center, i) => {
            const latest = [...points]
              .filter((p) => !p.isZoneCenter)
              .sort(
                (a, b) =>
                  haversineDistance(a, { lat: center.lat, lng: center.lng }) -
                  haversineDistance(b, { lat: center.lat, lng: center.lng }),
              )[0];
            if (!latest) return null;
            const [x1, y1] = px(center);
            const [x2, y2] = px(latest);
            return (
              <line
                key={`line-${i}`}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="rgba(232,169,76,0.7)"
                strokeWidth="2"
                strokeDasharray="4 4"
              />
            );
          })}
      </svg>

      {/* Overlay markers as HTML for crisp icons */}
      {points.map((p, i) => {
        const [x, y] = px(p);
        return (
          <div
            key={i}
            className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: x, top: y }}
          >
            {p.isZoneCenter ? (
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-remme-sage text-white shadow-glass ring-4 ring-white/70">
                <Home aria-hidden className="h-5 w-5" />
              </span>
            ) : (
              <span className="flex flex-col items-center">
                <MapPin aria-hidden className="h-8 w-8 text-remme-status-attention drop-shadow" />
                {p.label ? (
                  <span className="mt-1 rounded-lg bg-remme-offwhite/90 px-2 py-0.5 text-xs font-medium text-remme-ink shadow-sm">
                    {p.label}
                  </span>
                ) : null}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
