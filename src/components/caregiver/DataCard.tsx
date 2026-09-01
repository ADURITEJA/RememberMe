import * as React from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface DataCardProps {
  label: string;
  value: React.ReactNode;
  icon?: LucideIcon;
  href?: string;
  tone?: boolean;
  hint?: React.ReactNode;
  className?: string;
}

/**
 * Compact stat card used across Caregiver Mode dashboards and report pages:
 * an icon chip, a value, a label and an optional link.
 */
export function DataCard({
  label,
  value,
  icon: Icon,
  href,
  tone = false,
  hint,
  className,
}: DataCardProps) {
  const inner = (
    <Card
      variant="glass-hover"
      className={cn("h-full", className)}
    >
      <CardContent className="p-5">
        {Icon ? (
          <span
            className={cn(
              "inline-flex h-11 w-11 items-center justify-center rounded-2xl",
              tone
                ? "bg-remme-sage text-white"
                : "bg-remme-sage/15 text-remme-sage-deep",
            )}
          >
            <Icon aria-hidden className="h-6 w-6" />
          </span>
        ) : null}
        <p className="mt-4 text-3xl font-bold text-remme-ink dark:text-remme-inklight">
          {value}
        </p>
        <p className="text-base text-remme-ink/60 dark:text-remme-inklight/60">
          {label}
        </p>
        {hint ? (
          <p className="mt-1 text-sm text-remme-ink/50 dark:text-remme-inklight/50">
            {hint}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );

  return href ? <Link href={href}>{inner}</Link> : inner;
}
