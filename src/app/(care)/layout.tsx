import type { Metadata } from "next";
import Link from "next/link";
import { HeartHandshake } from "lucide-react";
import NavBar from "@/components/care/NavBar";
import { requireCareSession } from "@/components/care/care-db";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Remme Care — Your calm companion",
  description:
    "Your daily companion for reminders, memories, your people and gentle routines.",
};

/**
 * Care Mode chrome: warm gradient backdrop, big friendly header with a
 * prominent SOS button, and a bottom navigation with large touch targets.
 * The section heading style ("Care Mode = large type, generous spacing")
 * is enforced by the token styles used inside each page.
 */
export default async function CareLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireCareSession();

  return (
    <div className="flex min-h-dvh flex-col">
      {/* Top chrome */}
      <header className="sticky top-0 z-30 bg-remme-offwhite/75 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3 px-4 py-3">
          <Link
            href="/home"
            className="flex min-h-12 items-center gap-2 rounded-2xl px-2 text-remme-ink transition-colors hover:bg-remme-sage/10"
            aria-label="Remme Care home"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-remme-sage text-white">
              <HeartHandshake aria-hidden className="h-6 w-6" />
            </span>
            <span className="flex flex-col leading-tight">
              <span className="text-lg font-bold tracking-tight">Remme</span>
              <span className="text-xs font-medium text-remme-sage-deep">Care Mode</span>
            </span>
          </Link>

          <Link href="/sos" aria-label="Call for help now">
            <Button
              variant="danger"
              size="lg"
              className="gap-2 px-6 text-lg font-bold min-touch"
            >
              <span className="h-3 w-3 animate-pulse rounded-full bg-white" aria-hidden />
              SOS
            </Button>
          </Link>
        </div>
      </header>

      {/* Page content */}
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-44 pt-6">
        {children}
      </main>

      <NavBar />
    </div>
  );
}