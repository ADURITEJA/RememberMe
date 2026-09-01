"use client";

/**
 * ConfirmDialog — a friendly, accessible inline confirmation overlay used all
 * across the Care Mode (SOS confirm, delete person/memory, etc.).
 *
 * Uses a native <dialog> for correct focus trapping + Escape handling, with a
 * soft glass aesthetic.
 */

import { useEffect, useRef } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: "danger" | "sage";
  onConfirm: () => void;
  onCancel: () => void;
  busy?: boolean;
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel = "Not now",
  tone = "danger",
  onConfirm,
  onCancel,
  busy = false,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const onClose = () => {
      if (open) onCancel();
    };
    dialog.addEventListener("close", onClose);
    return () => dialog.removeEventListener("close", onClose);
  }, [open, onCancel]);

  return (
    <dialog
      ref={dialogRef}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-3xl border-0 bg-remme-offwhite p-0 text-remme-ink shadow-glass-lg backdrop:bg-remme-charcoal/40 backdrop:backdrop-blur-sm open:flex"
      aria-labelledby="confirm-title"
      aria-describedby="confirm-message"
    >
      <div className="flex flex-col gap-4 p-7">
        <div className="flex items-start gap-4">
          <div
            className={
              tone === "danger"
                ? "flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-remme-status-emergency/10 text-remme-status-emergency"
                : "flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-remme-sage/10 text-remme-sage"
            }
          >
            <AlertTriangle aria-hidden className="h-8 w-8" />
          </div>
          <div className="flex flex-col gap-1">
            <h2 id="confirm-title" className="text-2xl font-semibold leading-snug">
              {title}
            </h2>
            <p id="confirm-message" className="text-lg leading-relaxed text-remme-ink/75">
              {message}
            </p>
          </div>
        </div>
        <div className="mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
          <Button type="button" variant="ghost" size="lg" onClick={onCancel} disabled={busy}>
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={tone === "danger" ? "danger" : "sage"}
            size="lg"
            onClick={onConfirm}
            isLoading={busy}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </dialog>
  );
}