"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Plus, X, Receipt, Camera, Dumbbell as DumbbellIcon, Scale, Target } from "lucide-react";
import { cn } from "@/lib/cn";
import { mobileNavItems } from "./nav-items";
import type { Dictionary } from "@/lib/i18n";

type QuickActionKey = "addExpense" | "addMeal" | "startWorkout" | "addWeight" | "addGoal";

const quickActions: { labelKey: QuickActionKey; icon: typeof Receipt; domain: "money" | "nutrition" | "fitness" | "accent"; href?: string }[] = [
  { labelKey: "addExpense", icon: Receipt, domain: "money", href: "/money/transactions/new" },
  { labelKey: "addMeal", icon: Camera, domain: "nutrition" },
  { labelKey: "startWorkout", icon: DumbbellIcon, domain: "fitness" },
  { labelKey: "addWeight", icon: Scale, domain: "accent" },
  { labelKey: "addGoal", icon: Target, domain: "accent" },
];

const domainText = {
  money: "text-money",
  nutrition: "text-nutrition",
  fitness: "text-fitness",
  accent: "text-accent-ink",
} as const;

export function MobileNav({ t }: { t: Dictionary }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const [left, right] = [mobileNavItems.slice(0, 2), mobileNavItems.slice(2)];

  return (
    <>
      {open && (
        <button
          aria-label={t.mobileNav.closeQuickActions}
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
        />
      )}

      <div
        className={cn(
          "fixed inset-x-0 bottom-20 z-50 mx-4 origin-bottom rounded-2xl border border-border-soft bg-surface p-2 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.35)] transition-all md:hidden",
          open
            ? "translate-y-0 scale-100 opacity-100"
            : "pointer-events-none translate-y-4 scale-95 opacity-0"
        )}
      >
        {quickActions.map((action) =>
          action.href ? (
            <Link
              key={action.labelKey}
              href={action.href}
              onClick={() => setOpen(false)}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left font-display text-sm font-medium text-ink hover:bg-surface-raised"
            >
              <action.icon size={18} className={domainText[action.domain]} />
              {t.mobileNav[action.labelKey]}
            </Link>
          ) : (
            <button
              key={action.labelKey}
              type="button"
              disabled
              className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left font-display text-sm font-medium text-ink-soft opacity-60"
            >
              <action.icon size={18} className={domainText[action.domain]} />
              {t.mobileNav[action.labelKey]}
              <span className="ml-auto font-mono text-xs text-ink-faint">{t.mobileNav.soon}</span>
            </button>
          )
        )}
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-50 flex items-center justify-around border-t border-border-soft bg-surface/95 px-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2 backdrop-blur md:hidden">
        {left.map((item) => (
          <NavLink key={item.href} href={item.href} label={t.nav[item.labelKey]} Icon={item.icon} active={pathname.startsWith(item.href)} />
        ))}

        <button
          type="button"
          aria-label={open ? t.common.close : t.mobileNav.quickActions}
          onClick={() => setOpen((v) => !v)}
          className="flex h-12 w-12 -translate-y-3 items-center justify-center rounded-full bg-accent text-white shadow-lg shadow-accent/30 transition-transform active:scale-95"
        >
          {open ? <X size={22} /> : <Plus size={22} />}
        </button>

        {right.map((item) => (
          <NavLink key={item.href} href={item.href} label={t.nav[item.labelKey]} Icon={item.icon} active={pathname.startsWith(item.href)} />
        ))}
      </nav>
    </>
  );
}

function NavLink({
  href,
  label,
  Icon,
  active,
}: {
  href: string;
  label: string;
  Icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex flex-1 flex-col items-center gap-1 rounded-lg py-1.5 font-display text-[11px] font-medium",
        active ? "text-accent-ink" : "text-ink-faint"
      )}
    >
      <Icon size={20} strokeWidth={2} />
      {label}
    </Link>
  );
}
