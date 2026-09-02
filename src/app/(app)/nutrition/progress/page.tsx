import { Card } from "@/components/ui/card";
import { NutritionNav } from "@/components/nutrition/nutrition-nav";
import { requireUserId } from "@/lib/auth/session";
import { getStats } from "@/lib/nutrition/history/getStats";
import { WeightChart } from "./WeightChart";
import { WeightForm } from "./WeightForm";

export default async function NutritionProgressPage() {
  const userId = await requireUserId();

  const stats = await getStats(userId);
  const diff = stats.currentWeight != null && stats.weightGoal != null ? stats.currentWeight - stats.weightGoal : null;

  return (
    <div>
      <NutritionNav />

      <h1 className="mb-4 font-display text-xl font-bold text-ink">Progreso</h1>

      <section className="mb-4 grid grid-cols-2 gap-3">
        <StatCard label="Calorías promedio" value={`${stats.avgCalories}`} unit="kcal" />
        <StatCard label="Proteína promedio" value={`${stats.avgProtein}`} unit="g" />
        <StatCard label="Cumplimiento" value={stats.complianceRate != null ? `${stats.complianceRate}` : "—"} unit="%" />
        <StatCard label="Días registrados" value={`${stats.daysLogged}`} unit="últimos 30 días" />
      </section>

      <Card className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-sm font-medium text-ink">Peso</h2>
          <WeightForm initialWeight={stats.currentWeight} />
        </div>
        {stats.currentWeight != null && (
          <div className="flex flex-wrap gap-4 text-sm text-ink-soft">
            <span>Actual: {stats.currentWeight} kg</span>
            {stats.weightGoal != null && <span>Objetivo: {stats.weightGoal} kg</span>}
            {diff != null && (
              <span>{diff > 0 ? `${diff.toFixed(1)} kg por bajar` : diff < 0 ? `${Math.abs(diff).toFixed(1)} kg por subir` : "En objetivo"}</span>
            )}
          </div>
        )}
        <WeightChart data={stats.weightSeries} />
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
