import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

/**
 * Large, calm, glassy input built for warm care-facing UIs.
 */
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex min-h-14 w-full rounded-2xl border border-remme-sage/25 bg-white/70 px-5 py-3 text-lg text-remme-ink placeholder:text-remme-ink/40 shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-remme-sage/30 focus-visible:border-remme-sage/40 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-remme-charcoal/70 dark:text-remme-inklight dark:border-white/10 dark:placeholder:text-remme-inklight/40",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };