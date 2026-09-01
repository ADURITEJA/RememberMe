"use client";

import * as React from "react";
import { Download, FileText, ImageIcon } from "lucide-react";
import { jsPDF } from "jspdf";

/**
 * Memory library rendering + PDF export for the caregiver.
 *
 * Everything is server-fetched and passed in as plain serializable data; the
 * PDF is generated entirely in the browser with jsPDF (offline-friendly).
 */

type MemoryRecord = {
  id: string;
  title: string;
  description: string | null;
  date: string;
  location: string | null;
  mediaCount: number;
  transcript: string | null;
};

function generatePdf(memories: MemoryRecord[], patientName: string) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 48;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  doc.setFillColor(91, 140, 114);
  doc.rect(0, 0, pageWidth, 96, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.text("Remme — Memory Library", margin, 52);
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text(
    `Prepared for ${patientName} on ${new Date().toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    })}`,
    margin,
    74,
  );

  y = 132;
  doc.setTextColor(38, 48, 43);
  doc.setFontSize(14);

  if (memories.length === 0) {
    doc.text("No memories to show.", margin, y);
    doc.save(`remme-memory-library-${patientName.replace(/\s+/g, "-")}.pdf`);
    return;
  }

  for (const m of memories) {
    // Page break guard.
    const estHeight = 90 + (m.description?.length ?? 0) * 0.4 + (m.transcript?.length ?? 0) * 0.3;
    if (y + estHeight > pageHeight - margin) {
      doc.addPage();
      y = margin;
      doc.setFillColor(91, 140, 114);
      doc.rect(0, 0, pageWidth, 48, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("Remme — Memory Library (continued)", margin, 30);
      doc.setTextColor(38, 48, 43);
      y = 64;
    }

    // Memory card header (soft fill).
    doc.setFillColor(238, 234, 224);
    doc.roundedRect(margin - 12, y - 22, contentWidth + 24, 40, 8, 8, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.text(m.title, margin, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(91, 140, 114);
    const meta = [m.date, m.location, m.mediaCount ? `${m.mediaCount} media item(s)` : null]
      .filter(Boolean)
      .join("   ·   ");
    doc.text(meta, margin, y + 4);
    y += 22;

    // Description.
    doc.setTextColor(38, 48, 43);
    doc.setFontSize(11);
    if (m.description) {
      const lines = doc.splitTextToSize(m.description, contentWidth);
      doc.text(lines, margin, y + 4);
      y += lines.length * 14 + 6;
    }

    // Transcript.
    if (m.transcript) {
      doc.setFont("helvetica", "bolditalic");
      doc.setFontSize(10);
      doc.setTextColor(91, 140, 114);
      doc.text("Transcript", margin, y + 4);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(60, 60, 55);
      const tLines = doc.splitTextToSize(m.transcript, contentWidth);
      doc.text(tLines, margin, y + 18);
      y += tLines.length * 12 + 18;
    } else {
      y += 8;
    }
  }

  doc.save(`remme-memory-library-${patientName.replace(/\s+/g, "-")}.pdf`);
}

function MemoryBlock({ m }: { m: MemoryRecord }) {
  return (
    <article className="glass-card p-5 transition-all hover:shadow-glass">
      <div className="flex items-start gap-4">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-remme-amber/20">
          <ImageIcon aria-hidden className="h-6 w-6 text-remme-sage-deep" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-semibold leading-snug text-remme-ink dark:text-remme-inklight">
            {m.title}
          </h3>
          <p className="text-sm text-remme-ink/55">
            {m.date} {m.location ? `· ${m.location}` : ""}
            {m.mediaCount ? ` · ${m.mediaCount} media` : ""}
          </p>
          {m.description ? (
            <p className="mt-2 text-lg leading-relaxed text-remme-ink/70">{m.description}</p>
          ) : null}
          {m.transcript ? (
            <p className="mt-2 rounded-xl bg-remme-sage/8 px-3 py-2 text-base italic text-remme-ink/60">
              {m.transcript}
            </p>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export default function MemoryLibrary({
  memories,
  patientName,
}: {
  memories: MemoryRecord[];
  patientName: string;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-remme-ink/70">
          <FileText aria-hidden className="h-5 w-5 text-remme-sage" />
          <span className="text-lg">
            {memories.length} memor{memories.length === 1 ? "y" : "ies"}
          </span>
        </div>
        <button
          type="button"
          onClick={() => generatePdf(memories, patientName)}
          className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-remme-sage px-5 text-lg font-medium text-white shadow-md transition-colors hover:bg-remme-sage/90 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-remme-sage/40"
        >
          <Download aria-hidden className="h-5 w-5" />
          Export PDF
        </button>
      </div>

      {memories.length === 0 ? (
        <div className="flex min-h-[14rem] flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-remme-sage/30 bg-white/40 p-10 text-center">
          <FileText aria-hidden className="h-10 w-10 text-remme-sage" />
          <p className="text-lg text-remme-ink/55">
            No memories recorded for this patient yet.
          </p>
          <p className="text-base text-remme-ink/55">{patientName} doesn&apos;t have any memories yet.</p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {memories.map((m) => (
            <MemoryBlock key={m.id} m={m} />
          ))}
        </div>
      )}
    </div>
  );
}
