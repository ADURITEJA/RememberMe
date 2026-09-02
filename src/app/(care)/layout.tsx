import type { Metadata } from "next";
import Link from "next/link";
import { HeartHandshake, Settings } from "lucide-react";
import NavBar from "@/components/care/NavBar";
import { requireCareSession } from "@/components/care/care-db";
import { Button } from "@/components/ui/button";
import OnboardingGate from "@/components/onboarding/OnboardingGate";

export const metadata: Metadata = {
  title: "Remme Care — Your calm companion",
  description:
    "Your daily companion for reminders, memories, your people and gentle routines.",
};

/**
 * Care Mode chrome: Apple-style translucent header, bottom nav.
 */
export default async function CareLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireCareSession();

  return (
    <div className="flex min-h-dvh flex-col">
      {/* Apple-style sticky header */}
      <header className="sticky top-0 z-30 bg-white/72 backdrop-blur-[20px] saturate-[180%] border-b border-[rgba(0,0,0,0.05)]">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3 px-4 py-3">
          <Link
            href="/home"
            className="flex min-h-12 items-center gap-2 rounded-[980px] px-3 text-[#1d1d1f] transition-all duration-200 hover:bg-[#f5f5f7]"
            aria-label="Remme Care home"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-[980px] bg-[#0071e3] text-white">
              <HeartHandshake aria-hidden className="h-5 w-5" />
            </span>
            <span className="flex flex-col leading-tight">
              <span className="text-base font-semibold tracking-tight">Remme</span>
              <span className="text-xs font-medium text-[#86868b]">Care Mode</span>
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <Link
              href="/settings"
              aria-label="Settings"
              className="flex h-11 w-11 items-center justify-center rounded-[980px] text-[#86868b] transition-all duration-200 hover:bg-[#f5f5f7] hover:text-[#1d1d1f]"
            >
              <Settings aria-hidden className="h-5 w-5" />
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
        </div>
      </header>

      {/* Page content */}
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-44 pt-6">
        <OnboardingGate>{children}</OnboardingGate>
      </main>

      <NavBar />
    </div>
  );
}
