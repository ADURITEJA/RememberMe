import { Images, Bell, UsersRound, CalendarDays, Bot, Smile } from "lucide-react";

function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-2xl bg-remme-sage/10 ${className ?? ""}`}
      aria-hidden
    />
  );
}

/**
 * Care Mode loading fallback — soft, calm skeleton so nothing jumps.
 */
export default function CareLoading() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-label="Loading">
      <div className="flex flex-col gap-2">
        <SkeletonBlock className="h-10 w-36" />
        <SkeletonBlock className="h-6 w-56" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <SkeletonBlock className="h-36" />
        <SkeletonBlock className="h-36" />
        <SkeletonBlock className="h-36 sm:col-span-2" />
      </div>

      <div className="glass-card flex flex-col items-center gap-4 p-8 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-remme-sage/10 text-remme-sage-deep">
          <Images aria-hidden />
        </div>
        <p className="text-lg text-remme-ink/60">Gathering your things together…</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[Bell, UsersRound, CalendarDays, Bot].map((Icon, i) => (
          <div
            key={i}
            className="glass-card flex flex-col items-center gap-2 p-4 text-remme-sage-deep"
          >
            <Icon aria-hidden className="h-7 w-7" />
            <SkeletonBlock className="h-4 w-16" />
          </div>
        ))}
        <Smile aria-hidden className="hidden" />
      </div>
    </div>
  );
}