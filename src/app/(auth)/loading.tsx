import { HeartHandshake } from "lucide-react";

export default function AuthLoading() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-[20px] bg-[#0071e3]/10 animate-pulse">
        <HeartHandshake aria-hidden className="h-8 w-8 text-[#0071e3]" strokeWidth={1.5} />
      </div>
      <p className="text-lg text-[#86868b]">Loading…</p>
    </div>
  );
}
