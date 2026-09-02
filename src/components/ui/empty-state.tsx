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
 * Apple-style empty-state placeholder with an optional call to action.
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
        "flex min-h-[16rem] flex-col items-center justify-center gap-4 rounded-[20px] border border-dashed border-[rgba(0,0,0,0.1)] bg-white/40 p-10 text-center",
        className,
      )}
    >
      {Icon ? (
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#0071e3]/10">
          <Icon aria-hidden="true" className="h-10 w-10 text-[#0071e3]" strokeWidth={1.5} />
        </div>
      ) : null}
      <div>
        <h3 className="text-xl font-semibold text-[#1d1d1f]">
          {title}
        </h3>
        {description ? (
          <p className="mt-2 max-w-sm text-lg text-[#86868b]">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}

export { EmptyState };
