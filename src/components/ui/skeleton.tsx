import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Minimal skeleton shimmer used for loading states.
 */
function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-xl bg-remme-sage/10",
        className,
      )}
      {...props}
    />
  );
}

export { Skeleton };