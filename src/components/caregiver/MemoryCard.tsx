"use client";

import * as React from "react";
import { jsPDF } from "jspdf";
import { format } from "date-fns";
import { Sparkles, MapPin, FileDown, Image as ImageIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/caregiver/StatusBadge";

export interface MemoryCardData {
  id: string;
  title: string;
  description?: string | null;
  date: string; // ISO
  location?: string | null;
  transcript?: string | null;
  photo?: string | null;
  patientName?: string;
}

function exportMemoryPdf(m: MemoryCardData) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 22;

  const ink: [number, number, number] = [38, 48, 43];
  const sage: [number, number, number] = [91, 140, 114];
  const amber: [number, number, number] = [232, 169, 76];

  // Header ribbon
  doc.setFillColor(sage[0], sage[1], sage[2]);
  doc.rect(0, 0, pageWidth, 14, "F");
  doc.setFillColor(amber[0], amber[1], amber[2]);
  doc.rect(0, 14, pageWidth, 2, "F");

  doc.setTextColor(ink[0], ink[1], ink[2]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("REMME — Memory keepsake", margin, 26);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(
    m.patientName ? `A keepsake for ${m.patientName}` : "A keepsake from Remme",
    margin,
    33,
  );

  // Title + metadata
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text(m.title, margin, 52);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  const meta = `${format(new Date(m.date), "MMMM d, yyyy")}${m.location ? `  ·  ${m.location}` : ""}`;
  doc.setTextColor(120, 130, 125);
  doc.text(meta, margin, 62);

  // Description
  doc.setTextColor(ink[0], ink[1], ink[2]);
  if (m.description) {
    doc.setFontSize(12);
    const desc = doc.splitTextToSize(m.description, pageWidth - margin * 2);
    doc.text(desc, margin, 78);
  }

  // Transcript block
  if (m.transcript) {
    let y = 120;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(sage[0], sage[1], sage[2]);
    doc.text("What they remembered", margin, y);
    y += 8;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(ink[0], ink[1], ink[2]);
    const lines = doc.splitTextToSize(m.transcript, pageWidth - margin * 2);
    doc.text(lines, margin, y);
  }

  // Footer
  const h = doc.internal.pageSize.getHeight();
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(
    "Made with Remme — supporting memory care with warmth.",
    margin,
    h - 14,
  );

  doc.save(`${m.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase() || "memory"}-keepsake.pdf`);
}

export function MemoryCard({ memory }: { memory: MemoryCardData }) {
  const [open, setOpen] = React.useState(false);
  const date = new Date(memory.date);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="group flex h-full flex-col overflow-hidden rounded-3xl border border-remme-sage/10 bg-white/55 text-left transition-all hover:-translate-y-0.5 hover:shadow-glass focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-remme-sage/40"
        >
          {memory.photo ? (
            <div className="relative h-36 w-full overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={memory.photo}
                alt=""
                className="h-full w-full object-cover"
                loading="lazy"
                onError={(e) => {
                  (e.currentTarget.parentElement as HTMLElement | null)?.classList.add("hidden");
                }}
              />
            </div>
          ) : (
            <div className="flex h-24 w-full items-center justify-center bg-remme-amber/15">
              <ImageIcon aria-hidden className="h-9 w-9 text-remme-amber" />
            </div>
          )}
          <div className="flex flex-1 flex-col gap-2 p-5">
            <p className="text-lg font-semibold leading-tight text-remme-ink dark:text-remme-inklight">
              {memory.title}
            </p>
            <div className="flex flex-wrap items-center gap-2 text-sm text-remme-ink/55">
              <span className="inline-flex items-center gap-1">
                <Sparkles aria-hidden className="h-4 w-4 text-remme-sage" />
                {format(date, "MMMM d, yyyy")}
              </span>
              {memory.location ? (
                <span className="inline-flex items-center gap-1">
                  <MapPin aria-hidden className="h-4 w-4 text-remme-amber" />
                  {memory.location}
                </span>
              ) : null}
            </div>
            {memory.description ? (
              <p className="line-clamp-2 text-base text-remme-ink/70 dark:text-remme-inklight/70">
                {memory.description}
              </p>
            ) : null}
            <div className="mt-auto flex items-center justify-between pt-2">
              <StatusBadge tone="sage" dot>
                View memory
              </StatusBadge>
              <FileDown
                aria-hidden
                className="h-5 w-5 text-remme-sage-deep/60 opacity-0 transition-opacity group-hover:opacity-100"
              />
            </div>
          </div>
        </button>
      </DialogTrigger>

      <DialogContent title={memory.title} description="A keepsake memory">
        <div className="flex flex-col gap-4">
          {memory.photo ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={memory.photo}
              alt={memory.title}
              className="h-48 w-full rounded-2xl object-cover"
              onError={(e) => (e.currentTarget.style.display = "none")}
            />
          ) : (
            <div className="flex h-24 items-center justify-center rounded-2xl bg-remme-amber/15">
              <ImageIcon aria-hidden className="h-9 w-9 text-remme-amber" />
            </div>
          )}
          <p className="text-base text-remme-ink/60">
            {format(date, "EEEE, MMMM d, yyyy")}
            {memory.location ? ` · ${memory.location}` : ""}
          </p>
          {memory.description ? (
            <p className="text-lg text-remme-ink dark:text-remme-inklight">
              {memory.description}
            </p>
          ) : null}
          {memory.transcript ? (
            <div className="rounded-2xl border border-remme-sage/15 bg-remme-sage/8 p-4">
              <p className="mb-1 text-sm font-semibold uppercase tracking-wide text-remme-sage-deep">
                Spoken memory
              </p>
              <p className="text-base text-remme-ink/80">&ldquo;{memory.transcript}&rdquo;</p>
            </div>
          ) : null}
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
          >
            Close
          </Button>
          <Button type="button" variant="sage" onClick={() => exportMemoryPdf(memory)}>
            <FileDown aria-hidden className="mr-2 h-5 w-5" />
            Export keepsake PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
