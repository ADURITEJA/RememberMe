import * as React from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | "default"
    | "outline"
    | "ghost"
    | "glass"
    | "danger"
    | "sage"
    | "amber";
  size?: "default" | "sm" | "lg" | "xl" | "icon";
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = "glass", size = "default", isLoading, children, disabled, ...props },
    ref,
  ) => {
    const variants: Record<string, string> = {
      default:
        "bg-[#0071e3] text-white hover:bg-[#0077ED] hover:brightness-108 hover:scale-[1.02] active:scale-[0.98] shadow-md border border-transparent",
      glass:
        "bg-white/72 backdrop-blur-[20px] border border-[rgba(0,0,0,0.08)] text-[#1d1d1f] hover:bg-white/82 hover:scale-[1.02] active:scale-[0.98] font-medium transition-all duration-300",
      outline:
        "border border-[#0071e3] text-[#0071e3] bg-transparent hover:bg-[#0071e3]/5 hover:scale-[1.02] active:scale-[0.98]",
      ghost:
        "text-[#1d1d1f] hover:bg-[#f5f5f7] active:scale-[0.98] bg-transparent",
      danger:
        "bg-[#ff3b30] text-white hover:bg-[#ff453a] hover:brightness-108 hover:scale-[1.02] active:scale-[0.98] shadow-md",
      sage:
        "bg-[#0071e3]/10 text-[#0071e3] hover:bg-[#0071e3]/15 hover:scale-[1.02] active:scale-[0.98]",
      amber:
        "bg-[#ff9f0a]/10 text-[#ff9f0a] hover:bg-[#ff9f0a]/15 hover:scale-[1.02] active:scale-[0.98]",
    };

    const sizes: Record<string, string> = {
      default: "h-11 px-5 py-2.5 text-sm font-medium rounded-[980px]",
      sm: "h-9 px-3.5 text-xs font-medium rounded-[980px]",
      lg: "h-12 px-6 text-base font-medium rounded-[980px]",
      xl: "h-14 px-8 text-lg font-medium rounded-[980px]",
      icon: "h-11 w-11 rounded-[980px] flex items-center justify-center",
    };

    return (
      <button
        ref={ref}
        disabled={isLoading || disabled}
        className={cn(
          "inline-flex items-center justify-center gap-2 whitespace-nowrap transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0071e3]/40 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 min-touch",
          variants[variant],
          sizes[size],
          className,
        )}
        {...props}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />}
        {children}
      </button>
    );
  },
);
Button.displayName = "Button";

export { Button };
