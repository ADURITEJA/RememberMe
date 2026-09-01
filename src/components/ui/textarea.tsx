import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

/**
 * Large, glassy textarea for notes, memories, and messages.
 */
const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[7rem] w-full rounded-2xl border border-remme-sage/25 bg-white/70 px-5 py-3 text-lg text-remme-ink placeholder:text-remme-ink/40 shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-remme-sage/30 focus-visible:border-remme-sage/40 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-remme-charcoal/70 dark:text-remme-inklight dark:border-white/10 dark:placeholder:text-remme-inklight/40",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Textarea.displayName = "Textarea";

export { Textarea };