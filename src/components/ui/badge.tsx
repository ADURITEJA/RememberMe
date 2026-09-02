import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "sage" | "amber" | "attention" | "outline" | "ink" | "emergency";
}

/**
 * Apple-style pill badge.
 */
function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variants: Record<string, string> = {
    default: "bg-[#0071e3]/10 text-[#0071e3]",
    sage: "bg-[#0071e3] text-white",
    amber: "bg-[#ff9f0a]/10 text-[#ff9f0a]",
    attention: "bg-[#ff9f0a]/10 text-[#ff9f0a]",
    outline: "border border-[#0071e3]/20 text-[#0071e3]",
    ink: "bg-[#1d1d1f]/10 text-[#1d1d1f]",
    emergency: "bg-[#ff3b30] text-white",
  };
  return (
    <div
      className={cn(
        "inline-flex min-h-7 items-center gap-1 whitespace-nowrap rounded-[980px] px-2.5 py-0.5 text-xs font-medium",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}

export { Badge };
