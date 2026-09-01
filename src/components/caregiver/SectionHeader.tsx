import * as React from "react";

/**
 * Calm, consistent page heading used at the top of every Caregiver Mode page:
 * a big title, an optional warm greeting/subtitle, and an optional action slot
 * on the right (buttons, quick links).
 */
export function SectionHeader({
  title,
  subtitle,
  action,
  className,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between ${className ?? ""}`}
    >
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-semibold tracking-tight text-remme-ink dark:text-remme-inklight sm:text-3xl">
          {title}
        </h2>
        {subtitle ? (
          <p className="text-lg text-remme-ink/65 dark:text-remme-inklight/65">
            {subtitle}
          </p>
        ) : null}
      </div>
      {action ? <div className="flex shrink-0 flex-wrap items-center gap-3">{action}</div> : null}
    </section>
  );
}
