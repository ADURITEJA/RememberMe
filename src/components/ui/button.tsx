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
      default: "bg-remme-sage text-white shadow-md hover:bg-remme-sage/90 border border-transparent",
      glass:
        "glass-card text-remme-ink dark:text-remme-inklight font-medium active:scale-[0.97] transition-transform",
      outline:
        "border-2 border-remme-sage text-remme-sage hover:bg-remme-sage/10 bg-transparent",
      ghost:
        "hover:bg-black/5 dark:hover:bg-white/5 text-remme-ink dark:text-remme-inklight bg-transparent",
      danger:
        "bg-remme-status-emergency text-white hover:bg-remme-status-emergency/90 shadow-md",
      sage: "bg-remme-sage text-white hover:bg-remme-sage/90 shadow-md",
      amber: "bg-remme-amber text-white hover:bg-remme-amber/90 shadow-md",
    };

    const sizes: Record<string, string> = {
      default: "h-12 px-6 py-2 text-lg rounded-2xl",
      sm: "h-10 px-4 text-base rounded-xl",
      lg: "h-14 px-8 text-xl rounded-[1.25rem]",
      xl: "h-16 px-10 text-2xl font-medium rounded-[1.75rem]", // care mode large touch
      icon: "h-14 w-14 rounded-2xl flex items-center justify-center",
    };

    return (
      <button
        ref={ref}
        disabled={isLoading || disabled}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-remme-sage/40 disabled:pointer-events-none disabled:opacity-50 min-touch",
          variants[variant],
          sizes[size],
          className,
        )}
        {...props}
      >
        {isLoading && <Loader2 className="mr-2 h-6 w-6 animate-spin" aria-hidden />}
        {children}
      </button>
    );
  },
);
Button.displayName = "Button";

export { Button };