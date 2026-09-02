import { HeartHandshake } from "lucide-react";

export default function RootLoading() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-remme-sage/15 animate-pulse">
        <HeartHandshake aria-hidden className="h-8 w-8 text-remme-sage" />
      </div>
      <p className="text-lg text-remme-ink/60">Loading Remme…</p>
    </div>
  );
}
