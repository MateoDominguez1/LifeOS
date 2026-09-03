import { Card } from "@/components/ui/card";
import { NutritionNav } from "@/components/nutrition/nutrition-nav";
import { requireUserId } from "@/lib/auth/session";
import { getStats } from "@/lib/nutrition/history/getStats";
import { getT } from "@/lib/i18n";
import { WeightChart } from "./WeightChart";
import { WeightForm } from "./WeightForm";

export default async function NutritionProgressPage() {
  const [userId, { t }] = await Promise.all([requireUserId(), getT()]);

  const stats = await getStats(userId);
  const diff = stats.currentWeight != null && stats.weightGoal != null ? stats.currentWeight - stats.weightGoal : null;

  return (
    <div>
      <NutritionNav />

      <h1 className="mb-4 font-display text-xl font-bold text-ink">{t.nutrition.progress.title}</h1>

      <section className="mb-4 grid grid-cols-2 gap-3">
        <StatCard label={t.nutrition.progress.avgCaloriesLabel} value={`${stats.avgCalories}`} unit="kcal" />
        <StatCard label={t.nutrition.progress.avgProteinLabel} value={`${stats.avgProtein}`} unit="g" />
        <StatCard label={t.nutrition.progress.complianceLabel} value={stats.complianceRate != null ? `${stats.complianceRate}` : "—"} unit="%" />
        <StatCard label={t.nutrition.progress.daysLoggedLabel} value={`${stats.daysLogged}`} unit={t.nutrition.progress.last30Days} />
      </section>

      <Card className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-sm font-medium text-ink">{t.nutrition.progress.weightTitle}</h2>
          <WeightForm initialWeight={stats.currentWeight} t={t} />
        </div>
        {stats.currentWeight != null && (
          <div className="flex flex-wrap gap-4 text-sm text-ink-soft">
            <span>{t.nutrition.progress.currentLabel} {stats.currentWeight} kg</span>
            {stats.weightGoal != null && <span>{t.nutrition.progress.goalLabel} {stats.weightGoal} kg</span>}
            {diff != null && (
              <span>
                {diff > 0
                  ? `${diff.toFixed(1)} ${t.nutrition.progress.toLoseSuffix}`
                  : diff < 0
                    ? `${Math.abs(diff).toFixed(1)} ${t.nutrition.progress.toGainSuffix}`
                    : t.nutrition.progress.onTarget}
              </span>
            )}
          </div>
        )}
        <WeightChart data={stats.weightSeries} t={t} />
      </Card>
    </div>
  );
}

function StatCard({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <Card className="text-center">
      <div className="font-display text-2xl font-bold text-ink">{value}</div>
      <div className="text-xs text-ink-faint">{unit}</div>
      <div className="mt-1 text-xs text-ink-soft">{label}</div>
    </Card>
  );
}
