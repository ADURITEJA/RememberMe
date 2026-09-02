"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

/**
 * Accessible, Apple-style glass modal dialog with focus trap and Escape-to-close.
 */

type DialogContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
  contentRef: React.RefObject<HTMLDivElement | null>;
};
const DialogContext = React.createContext<DialogContextValue | null>(null);

function useDialogContext() {
  const ctx = React.useContext(DialogContext);
  if (!ctx) throw new Error("Dialog components must be used within <Dialog>");
  return ctx;
}

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

function Dialog({ open, onOpenChange, children }: DialogProps) {
  const contentRef = React.useRef<HTMLDivElement | null>(null);
  const lastFocused = React.useRef<HTMLElement | null>(null);

  const setOpen = React.useCallback(
    (next: boolean) => {
      if (!next) lastFocused.current?.focus?.();
      onOpenChange(next);
    },
    [onOpenChange],
  );

  React.useEffect(() => {
    if (open) {
      lastFocused.current = document.activeElement as HTMLElement | null;
      contentRef.current?.focus?.();
    }
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onOpenChange]);

  React.useEffect(() => {
    if (!open) return;
    const content = contentRef.current;
    if (!content) return;
    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const focusables = content.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || active === content)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handleTab);
    return () => document.removeEventListener("keydown", handleTab);
  }, [open]);

  const value = React.useMemo(() => ({ open, setOpen, contentRef }), [open, setOpen]);

  return <DialogContext.Provider value={value}>{children}</DialogContext.Provider>;
}

interface DialogTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
}

function DialogTrigger({ asChild, onClick, ...props }: DialogTriggerProps) {
  const { setOpen } = useDialogContext();
  if (asChild && React.isValidElement(props.children)) {
    const child = props.children as React.ReactElement<{
      onClick?: React.MouseEventHandler;
    }>;
    return React.cloneElement(child, {
      onClick: (e: React.MouseEvent) => {
        child.props.onClick?.(e);
        setOpen(true);
      },
    });
  }
  return <button type="button" onClick={() => setOpen(true)} {...props} />;
}

interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  hideClose?: boolean;
}

function DialogContent({
  className,
  children,
  title,
  description,
  hideClose,
  ...props
}: DialogContentProps) {
  const { open, setOpen, contentRef } = useDialogContext();
  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" aria-modal="true">
      {/* Backdrop — Apple style */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />
      {/* Modal panel — Apple Liquid Glass */}
      <div
        ref={contentRef}
        tabIndex={-1}
        role="dialog"
        aria-labelledby={title ? "remme-dialog-title" : undefined}
        aria-describedby={description ? "remme-dialog-desc" : undefined}
        className={cn(
          "relative z-10 w-full max-w-lg rounded-[20px] p-6 sm:p-8 bg-white/72 backdrop-blur-[20px] saturate-[180%] border border-[rgba(0,0,0,0.08)] shadow-[0_2px_12px_0_rgba(0,0,0,0.06),0_8px_32px_0_rgba(0,0,0,0.04)] animate-[dialogIn_0.2s_ease]",
          className,
        )}
        {...props}
      >
        {!hideClose && (
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close dialog"
            className="absolute right-4 top-4 min-touch rounded-[980px] p-2 text-[#86868b] hover:bg-[#f5f5f7] hover:text-[#1d1d1f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0071e3]/30 transition-all duration-200"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        )}
        {title ? (
          <h2 id="remme-dialog-title" className="pr-10 text-xl font-semibold text-[#1d1d1f]">
            {title}
          </h2>
        ) : null}
        {description ? (
          <p id="remme-dialog-desc" className="mt-2 text-base text-[#86868b]">
            {description}
          </p>
        ) : null}
        <div className="mt-6">{children}</div>
      </div>
    </div>,
    document.body,
  );
}

function DialogClose(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { setOpen } = useDialogContext();
  return (
    <button
      type="button"
      onClick={() => {
        props.onClick?.({} as React.MouseEvent<HTMLButtonElement>);
        setOpen(false);
      }}
      {...props}
    />
  );
}

function DialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end", className)}
      {...props}
    />
  );
}

export { Dialog, DialogTrigger, DialogContent, DialogClose, DialogFooter };
