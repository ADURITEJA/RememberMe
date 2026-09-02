import Link from "next/link";
import { HeartHandshake, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 text-center">
      <div className="flex flex-col items-center gap-6 max-w-md">
        <div className="flex h-24 w-24 items-center justify-center rounded-[24px] bg-[#0071e3]/10 text-[#0071e3]">
          <HeartHandshake aria-hidden className="h-12 w-12" strokeWidth={1.5} />
        </div>

        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-bold text-[#1d1d1f] tracking-tight">Page not found</h1>
          <p className="text-lg leading-relaxed text-[#86868b]">
            This page doesn&apos;t exist, but you&apos;re still exactly where you need to be.
          </p>
        </div>

        <Link href="/home">
          <Button size="lg" className="min-touch gap-2">
            <Home aria-hidden className="h-5 w-5" strokeWidth={1.5} />
            Go home
          </Button>
        </Link>
      </div>
    </div>
  );
}
