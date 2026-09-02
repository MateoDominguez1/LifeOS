import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Wallet,
  Utensils,
  Dumbbell,
  LineChart,
  Target,
  CalendarDays,
  Sparkles,
  Settings,
} from "lucide-react";
import type { Dictionary } from "@/lib/i18n";

export interface NavItem {
  href: string;
  labelKey: keyof Dictionary["nav"];
  icon: LucideIcon;
  domain?: "money" | "nutrition" | "fitness" | "accent";
}

export const desktopNavItems: NavItem[] = [
  { href: "/dashboard", labelKey: "home", icon: LayoutDashboard },
  { href: "/money", labelKey: "money", icon: Wallet, domain: "money" },
  { href: "/nutrition", labelKey: "nutrition", icon: Utensils, domain: "nutrition" },
  { href: "/fitness", labelKey: "fitness", icon: Dumbbell, domain: "fitness" },
  { href: "/progress", labelKey: "progress", icon: LineChart },
  { href: "/goals", labelKey: "goals", icon: Target, domain: "accent" },
  { href: "/calendar", labelKey: "calendar", icon: CalendarDays, domain: "accent" },
  { href: "/ai", labelKey: "ai", icon: Sparkles, domain: "accent" },
  { href: "/settings", labelKey: "settings", icon: Settings },
];

export const mobileNavItems: NavItem[] = [
  { href: "/dashboard", labelKey: "home", icon: LayoutDashboard },
  { href: "/money", labelKey: "money", icon: Wallet, domain: "money" },
  { href: "/fitness", labelKey: "fitness", icon: Dumbbell, domain: "fitness" },
  { href: "/more", labelKey: "more", icon: Settings },
];
