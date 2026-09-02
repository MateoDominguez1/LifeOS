"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  LayoutDashboard,
  Wallet,
  Receipt,
  PiggyBank,
  Repeat,
  Landmark,
  CalendarDays,
  BarChart3,
  Gift,
  ShoppingCart,
  Settings2,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/cn";

const primaryTabs = [
  { href: "/money", label: "Resumen", icon: LayoutDashboard },
  { href: "/money/accounts", label: "Cuentas", icon: Wallet },
  { href: "/money/transactions", label: "Movimientos", icon: Receipt },
];

const moreGroups = [
  {
    label: "Planificación",
    items: [
      { href: "/money/budgets", label: "Presupuestos", icon: PiggyBank },
      { href: "/money/fixed-expenses", label: "Gastos fijos", icon: Repeat },
      { href: "/money/income", label: "Ingresos", icon: Landmark },
    ],
  },
  {
    label: "Seguimiento",
    items: [
      { href: "/money/calendar", label: "Calendario", icon: CalendarDays },
      { href: "/money/stats", label: "Estadísticas", icon: BarChart3 },
      { href: "/money/important-dates", label: "Fechas importantes", icon: Gift },
    ],
  },
  {
    label: "Otros",
    items: [
      { href: "/money/shopping-list", label: "Lista de compras", icon: ShoppingCart },
      { href: "/money/settings", label: "Ajustes de Money", icon: Settings2 },
    ],
  },
];

const allMoreItems = moreGroups.flatMap((g) => g.items);

export function MoneyNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const isActive = (href: string) => (href === "/money" ? pathname === "/money" : pathname.startsWith(href));
  const activeMoreItem = allMoreItems.find((item) => isActive(item.href));

  useEffect(() => {
    function onClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onEscape);
    };
  }, []);

  return (
    <div className="relative z-40 isolate mb-6 flex items-center gap-1.5 rounded-2xl border border-border-soft bg-surface p-1.5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      {primaryTabs.map((tab) => {
        const Icon = tab.icon;
        const active = isActive(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "flex items-center gap-1.5 rounded-xl px-3 py-2 font-display text-sm font-medium transition-colors",
              active ? "bg-money-soft text-money" : "text-ink-soft hover:bg-surface-raised hover:text-ink"
            )}
          >
            <Icon size={15} className="shrink-0" />
            <span className="hidden sm:inline">{tab.label}</span>
          </Link>
        );
      })}

      <div ref={containerRef} className="relative ml-auto">
        <button
          type="button"
          aria-haspopup="menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className={cn(
            "flex items-center gap-1.5 rounded-xl px-3 py-2 font-display text-sm font-medium transition-colors",
            open || activeMoreItem ? "bg-accent-soft text-accent-ink" : "text-ink-soft hover:bg-surface-raised hover:text-ink"
          )}
        >
          {activeMoreItem ? (
            <activeMoreItem.icon size={15} className="shrink-0" />
          ) : (
            <Settings2 size={15} className="shrink-0" />
          )}
          <span>{activeMoreItem ? activeMoreItem.label : "Más"}</span>
          <ChevronDown size={14} className={cn("shrink-0 transition-transform", open && "rotate-180")} />
        </button>

        {open && (
          <div
            role="menu"
            className="absolute right-0 top-[calc(100%+8px)] z-30 w-64 rounded-2xl border border-border-soft bg-surface p-2 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.25)]"
          >
            {moreGroups.map((group, i) => (
              <div key={group.label} className={cn(i > 0 && "mt-1 border-t border-border-soft pt-1")}>
                <div className="px-2.5 pb-1 pt-2 font-display text-[11px] font-semibold uppercase tracking-wider text-ink-faint">
                  {group.label}
                </div>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      role="menuitem"
                      className={cn(
                        "flex items-center gap-2.5 rounded-xl px-2.5 py-2 font-display text-sm font-medium transition-colors",
                        active ? "bg-money-soft text-money" : "text-ink-soft hover:bg-surface-raised hover:text-ink"
                      )}
                    >
                      <Icon size={16} className="shrink-0" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
