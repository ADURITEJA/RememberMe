import * as React from "react";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

/**
 * Friendly empty-state placeholder with an optional call to action.
 */
function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex min-h-[16rem] flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-remme-sage/30 bg-white/40 p-10 text-center",
        className,
      )}
    >
      {Icon ? (
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-remme-sage/15">
          <Icon aria-hidden="true" className="h-10 w-10 text-remme-sage" />
        </div>
      ) : null}
      <div>
        <h3 className="text-xl font-semibold text-remme-ink dark:text-remme-inklight">
          {title}
        </h3>
        {description ? (
          <p className="mt-2 max-w-sm text-lg text-remme-ink/70 dark:text-remme-inklight/70">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}

export { EmptyState };