import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { requireUserId } from "@/lib/auth/session";
import { Card, CardLabel } from "@/components/ui/card";
import { formatCurrency } from "@/lib/money/format";
import { getMoneySnapshot } from "@/lib/money/getMoneySnapshot";
import { getStats as getNutritionStats } from "@/lib/nutrition/history/getStats";
import { getWeeklyFrequency, getWeeklyVolume } from "@/lib/fitness/progress/analytics";
import { getT } from "@/lib/i18n";
import { WeightTrendChart } from "./WeightTrendChart";

export default async function UnifiedProgressPage() {
  const [userId, { t }] = await Promise.all([requireUserId(), getT()]);

  const weightSince = new Date();
  weightSince.setDate(weightSince.getDate() - 90);

  const [weightEntries, moneySnapshot, nutritionStats, fitnessVolume, fitnessFrequency] = await Promise.all([
    prisma.weightEntry.findMany({
      where: { userId, managedProfileId: null, loggedAt: { gte: weightSince } },
      orderBy: { loggedAt: "asc" },
    }),
    getMoneySnapshot(userId).catch(() => null),
    getNutritionStats(userId, 30).catch(() => null),
    getWeeklyVolume(userId, 8).catch(() => []),
    getWeeklyFrequency(userId, 8).catch(() => []),
  ]);

  const weightSeries = weightEntries.map((w) => ({ date: w.loggedAt.toISOString().slice(0, 10), weightKg: w.weightKg }));
  const totalVolume = fitnessVolume.reduce((s, w) => s + w.volume, 0);
  const totalSessions = fitnessFrequency.reduce((s, w) => s + w.count, 0);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">{t.progress.title}</h1>
        <p className="mt-1 text-sm text-ink-soft">{t.progress.subtitle}</p>
      </div>

      <Card domain="accent">
        <CardLabel>{t.progress.bodyWeight}</CardLabel>
        <div className="mt-3">
          <WeightTrendChart data={weightSeries} t={t} />
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Link href="/money">
          <Card domain="money" className="h-full transition-colors hover:border-money/40">
            <div className="mb-2 flex items-center justify-between">
              <CardLabel>{t.nav.money}</CardLabel>
              <ArrowRight size={14} className="text-ink-faint" />
            </div>
            {moneySnapshot?.hasAccounts ? (
              <>
                <div className="font-mono text-lg font-semibold text-ink">{formatCurrency(moneySnapshot.available)}</div>
                <p className="text-xs text-ink-faint">{t.progress.available}</p>
              </>
            ) : (
              <p className="text-sm text-ink-soft">{t.progress.noDataYet}</p>
            )}
          </Card>
        </Link>

        <Link href="/nutrition/progress">
          <Card domain="nutrition" className="h-full transition-colors hover:border-nutrition/40">
            <div className="mb-2 flex items-center justify-between">
              <CardLabel>{t.nav.nutrition}</CardLabel>
              <ArrowRight size={14} className="text-ink-faint" />
            </div>
            {nutritionStats && nutritionStats.daysLogged > 0 ? (
              <>
                <div className="font-mono text-lg font-semibold text-ink">{nutritionStats.complianceRate ?? "—"}%</div>
                <p className="text-xs text-ink-faint">{t.progress.adherence30Days}</p>
              </>
            ) : (
              <p className="text-sm text-ink-soft">{t.progress.noDataYet}</p>
            )}
          </Card>
        </Link>

        <Link href="/fitness/progress">
          <Card domain="fitness" className="h-full transition-colors hover:border-fitness/40">
            <div className="mb-2 flex items-center justify-between">
              <CardLabel>{t.nav.fitness}</CardLabel>
              <ArrowRight size={14} className="text-ink-faint" />
            </div>
            {totalSessions > 0 ? (
              <>
                <div className="font-mono text-lg font-semibold text-ink">{Math.round(totalVolume)} kg</div>
                <p className="text-xs text-ink-faint">
                  {t.progress.volume} · {totalSessions} {t.progress.sessionsLast8Weeks}
                </p>
              </>
            ) : (
              <p className="text-sm text-ink-soft">{t.progress.noDataYet}</p>
            )}
          </Card>
        </Link>
      </div>
    </div>
  );
}
