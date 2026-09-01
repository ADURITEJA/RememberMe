"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Bell,
  UsersRound,
  Images,
  Bot,
  Smile,
  CalendarDays,
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
  { href: "/people", label: "My People", icon: <UsersRound aria-hidden /> },
  { href: "/memories", label: "My Memories", icon: <Images aria-hidden /> },
  { href: "/assistant", label: "Assistant", icon: <Bot aria-hidden /> },
  { href: "/mood", label: "Mood", icon: <Smile aria-hidden /> },
  { href: "/routine", label: "Routine", icon: <CalendarDays aria-hidden /> },
];

/**
 * Bottom navigation with large, easy tap targets — the Care Mode primary
 * navigation. Wraps to two rows on small phones so every item stays visible.
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
      className="fixed inset-x-0 bottom-0 z-40 border-t border-black/5 bg-remme-offwhite/85 backdrop-blur-xl pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_32px_rgba(31,38,32,0.06)]"
    >
      <div className="mx-auto flex w-full max-w-3xl flex-wrap items-stretch justify-center gap-x-1 gap-y-1 px-2 py-2">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-14 min-w-[4.75rem] flex-1 basis-[5.5rem] flex-col items-center justify-center gap-0.5 rounded-2xl px-1 py-1.5 text-center transition-colors min-touch",
                active
                  ? "bg-remme-sage/15 text-remme-sage-deep"
                  : "text-remme-ink/65 hover:bg-remme-sage/8 hover:text-remme-ink",
              )}
            >
              <span className="h-7 w-7" aria-hidden>
                {item.icon}
              </span>
              <span className="max-w-full text-xs font-medium leading-tight sm:text-sm">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}