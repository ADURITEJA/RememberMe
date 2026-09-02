import * as React from "react";
import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "glass" | "glass-hover" | "solid";
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = "glass", ...props }, ref) => {
    const variants: Record<string, string> = {
      default:
        "bg-white rounded-[18px] shadow-[0_1px_4px_0_rgba(0,0,0,0.05),0_4px_16px_0_rgba(0,0,0,0.03)] border border-[rgba(0,0,0,0.06)]",
      glass: "glass-card",
      "glass-hover":
        "glass-card border border-[rgba(0,0,0,0.06)] hover:shadow-[0_4px_24px_0_rgba(0,0,0,0.08),0_24px_60px_0_rgba(0,0,0,0.06)] hover:scale-[1.02] active:scale-[0.98] cursor-pointer transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
      solid: "glass-solid",
    };
    return (
      <div ref={ref} className={cn(variants[variant], className)} {...props} />
    );
  },
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-xl font-semibold leading-none tracking-tight",
      className,
    )}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

export { Card, CardHeader, CardTitle, CardContent };
