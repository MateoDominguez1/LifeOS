"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { desktopNavItems } from "./nav-items";
import { ThemeToggle } from "@/components/theme-toggle";
import type { Dictionary } from "@/lib/i18n";

const domainActiveClasses = {
  money: "bg-money-soft text-money",
  nutrition: "bg-nutrition-soft text-nutrition",
  fitness: "bg-fitness-soft text-fitness",
  accent: "bg-accent-soft text-accent-ink",
} as const;

export function Sidebar({ t }: { t: Dictionary["nav"] }) {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-border-soft px-4 py-6 md:flex">
      <div className="mb-8 flex items-center gap-2 px-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent font-display text-sm font-bold text-white">
          L
        </div>
        <span className="font-display text-base font-bold tracking-tight">
          LifeOS
        </span>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {desktopNavItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 font-display text-sm font-medium text-ink-soft transition-colors hover:bg-surface-raised hover:text-ink",
                isActive &&
                  (item.domain
                    ? domainActiveClasses[item.domain]
                    : "bg-surface-raised text-ink")
              )}
            >
              <Icon size={18} strokeWidth={2} />
              {t[item.labelKey]}
            </Link>
          );
        })}
      </nav>

      <div className="flex items-center justify-between px-2 pt-4">
        <span className="font-mono text-xs text-ink-faint">v0.1 · foundation</span>
        <ThemeToggle />
      </div>
    </aside>
  );
}
