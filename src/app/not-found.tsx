import Link from "next/link";
import { HeartHandshake, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 text-center">
      <div className="flex flex-col items-center gap-6 max-w-md">
        <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-remme-sage/12 text-remme-sage-deep">
          <HeartHandshake aria-hidden className="h-12 w-12" />
        </div>

        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-bold text-remme-ink">Page not found</h1>
          <p className="text-lg leading-relaxed text-remme-ink/65">
            This page doesn&apos;t exist, but you&apos;re still exactly where you need to be.
          </p>
        </div>

        <Link href="/home">
          <Button variant="sage" size="lg" className="min-touch gap-2">
            <Home aria-hidden className="h-5 w-5" />
            Go home
          </Button>
        </Link>
      </div>
    </div>
  );
}
