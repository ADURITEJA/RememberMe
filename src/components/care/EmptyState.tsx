"use client";

import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  message?: string;
  action?: React.ReactNode;
  className?: string;
}

/**
 * Friendly, oversized empty state used across the Care Mode.
 */
export default function EmptyState({
  icon,
  title,
  message,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "glass-card flex flex-col items-center justify-center gap-3 px-6 py-10 text-center",
        className,
      )}
    >
      {icon ? (
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-remme-sage/12 text-remme-sage-deep">
          {icon}
        </div>
      ) : null}
      <h2 className="text-2xl font-semibold text-remme-ink">{title}</h2>
      {message ? (
        <p className="max-w-md text-lg leading-relaxed text-remme-ink/70">{message}</p>
      ) : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}