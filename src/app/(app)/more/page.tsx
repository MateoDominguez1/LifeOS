import Link from "next/link";
import { Utensils, LineChart, Target, CalendarDays, Sparkles, Settings } from "lucide-react";
import { Card } from "@/components/ui/card";
import { getT } from "@/lib/i18n";
import type { Dictionary } from "@/lib/i18n";

const items: { href: string; labelKey: keyof Dictionary["nav"]; icon: typeof Utensils }[] = [
  { href: "/nutrition", labelKey: "nutrition", icon: Utensils },
  { href: "/progress", labelKey: "progress", icon: LineChart },
  { href: "/goals", labelKey: "goals", icon: Target },
  { href: "/calendar", labelKey: "calendar", icon: CalendarDays },
  { href: "/ai", labelKey: "ai", icon: Sparkles },
  { href: "/settings", labelKey: "settings", icon: Settings },
];

export default async function MorePage() {
  const { t } = await getT();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-display text-2xl font-bold tracking-tight">{t.nav.more}</h1>
      <div className="flex flex-col gap-2">
        {items.map((item) => (
          <Link key={item.href} href={item.href}>
            <Card className="flex items-center gap-3 py-3.5">
              <item.icon size={18} className="text-ink-soft" />
              <span className="font-display text-sm font-medium">{t.nav[item.labelKey]}</span>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
