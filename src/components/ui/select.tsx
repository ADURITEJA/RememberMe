import * as React from "react";
import { cn } from "@/lib/utils";

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {}

/**
 * Accessible dropdown with a comfortable touch target.
 */
const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div className="relative w-full">
        <select
          className={cn(
            "flex min-h-14 w-full appearance-none rounded-2xl border border-remme-sage/25 bg-white/70 px-5 py-3 pr-12 text-lg text-remme-ink shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-remme-sage/30 focus-visible:border-remme-sage/40 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-remme-charcoal/70 dark:text-remme-inklight dark:border-white/10",
            className,
          )}
          ref={ref}
          {...props}
        >
          {children}
        </select>
        {/* Chevron */}
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-remme-ink/50 dark:text-remme-inklight/50"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </div>
    );
  },
);
Select.displayName = "Select";

export { Select };