import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "sage" | "amber" | "attention" | "outline" | "ink" | "emergency";
}

/**
 * Small status pill.
 */
function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variants: Record<string, string> = {
    default: "bg-remme-sage/15 text-remme-sage-deep",
    sage: "bg-remme-sage text-white",
    amber: "bg-remme-amber/20 text-remme-ink",
    attention: "bg-remme-status-attention/15 text-remme-status-attention",
    outline: "border border-remme-sage/30 text-remme-sage-deep",
    ink: "bg-remme-ink/15 text-remme-ink",
    emergency: "bg-remme-status-emergency text-white",
  };
  return (
    <div
      className={cn(
        "inline-flex min-h-8 items-center gap-1 whitespace-nowrap rounded-full px-3 py-1 text-sm font-medium",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}

export { Badge };