"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Bell,
  Pill,
  UsersRound,
  Images,
  Bot,
  Smile,
  CalendarDays,
  BellDot,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/home", label: "Home", icon: <Home aria-hidden /> },
  { href: "/reminders", label: "Reminders", icon: <Bell aria-hidden /> },
  { href: "/medications", label: "Meds", icon: <Pill aria-hidden /> },
  { href: "/people", label: "My People", icon: <UsersRound aria-hidden /> },
  { href: "/memories", label: "My Memories", icon: <Images aria-hidden /> },
  { href: "/assistant", label: "Assistant", icon: <Bot aria-hidden /> },
  { href: "/mood", label: "Mood", icon: <Smile aria-hidden /> },
  { href: "/routine", label: "Routine", icon: <CalendarDays aria-hidden /> },
  { href: "/notifications", label: "Alerts", icon: <BellDot aria-hidden /> },
];

/**
 * Apple-style bottom navigation bar.
 */
export default function NavBar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/home") return pathname === "/home";
    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <nav
      aria-label="Main navigation"
      className="fixed inset-x-0 bottom-0 z-40 bg-white/72 backdrop-blur-[20px] saturate-[180%] border-t border-[rgba(0,0,0,0.05)] pb-[env(safe-area-inset-bottom)]"
    >
      <div className="mx-auto flex w-full max-w-3xl flex-wrap items-stretch justify-center gap-x-0.5 gap-y-0.5 px-2 py-1.5">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-14 min-w-[4.5rem] flex-1 basis-[5.25rem] flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1.5 text-center transition-all duration-200 min-touch",
                active
                  ? "text-[#0071e3]"
                  : "text-[#86868b] hover:text-[#1d1d1f]",
              )}
            >
              <span className="h-6 w-6" aria-hidden>
                {item.icon}
              </span>
              <span className="max-w-full text-[10px] font-medium leading-tight sm:text-xs">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
