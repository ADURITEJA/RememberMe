import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

/**
 * Apple-style input: clean, minimal, rounded.
 */
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex min-h-12 w-full rounded-xl border border-[rgba(0,0,0,0.1)] bg-[#f5f5f7] px-4 py-3 text-base text-[#1d1d1f] placeholder:text-[#86868b] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0071e3]/30 focus-visible:border-[#0071e3] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#2d2d2d] dark:text-[#f5f5f7] dark:border-white/10 dark:placeholder:text-[#86868b]",
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
