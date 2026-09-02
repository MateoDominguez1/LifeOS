import { prisma } from "@/lib/db/prisma";
import { requireUserId } from "@/lib/auth/session";
import { Card, CardLabel } from "@/components/ui/card";
import { FitnessNav } from "@/components/fitness/fitness-nav";
import {
  getMeasurementHistory,
  getMuscleGroupVolume,
  getStrengthHistory,
  getWeeklyFrequency,
  getWeeklyVolume,
  getWeightHistory,
} from "@/lib/fitness/progress/analytics";
import { computeWeightTrend } from "@/lib/fitness/progress/weight-trend";
import { FrequencyChart, MeasurementChart, MuscleGroupChart, StrengthChart, VolumeChart, WeightChart } from "./charts";
import { QuickAddMeasurement, QuickAddWeight } from "./quick-forms";

const TREND_LABEL: Record<string, string> = { up: "subiendo", down: "bajando", stable: "estable" };

export default async function FitnessProgressPage() {
  const userId = await requireUserId();

  const [weightSeries, measurements, strength, weeklyVolume, weeklyFrequency, muscleVolume, weightGoal, allWeightEntries] = await Promise.all([
    getWeightHistory(userId, 90),
    getMeasurementHistory(userId),
    getStrengthHistory(userId, 3),
    getWeeklyVolume(userId, 8),
    getWeeklyFrequency(userId, 8),
    getMuscleGroupVolume(userId, 28),
    prisma.goal.findFirst({ where: { userId, domain: "BODY", metric: "BODY_WEIGHT", status: "ACTIVE" } }),
    prisma.weightEntry.findMany({ where: { userId }, orderBy: { loggedAt: "desc" }, take: 30 }),
  ]);

  const latestWeight = weightSeries.length > 0 ? weightSeries[weightSeries.length - 1].weightKg : null;
  const trend = computeWeightTrend(allWeightEntries.map((e) => ({ weightKg: e.weightKg, loggedAt: e.loggedAt })));

  return (
    <div>
      <FitnessNav />

      <div className="flex flex-col gap-4">
        <Card domain="fitness">
          <div className="flex items-center justify-between">
            <CardLabel>Peso</CardLabel>
            <QuickAddWeight />
          </div>
          {latestWeight != null ? (
            <div className="mt-2">
              <div className="font-display text-3xl font-bold text-ink">{latestWeight} kg</div>
              <p className="text-sm text-ink-soft">
                {weightGoal && `Objetivo ${Number(weightGoal.targetValue)} kg`}
                {weightGoal && latestWeight != null && ` · ${Math.abs(latestWeight - Number(weightGoal.targetValue)).toFixed(1)}kg ${latestWeight > Number(weightGoal.targetValue) ? "por encima" : "por debajo"} del objetivo`}
              </p>
              {trend?.direction && <p className="text-xs text-ink-faint">Tendencia {TREND_LABEL[trend.direction]} esta semana</p>}
            </div>
          ) : (
            <p className="mt-2 text-sm text-ink-soft">Todavía no registraste tu peso.</p>
          )}
          <div className="mt-3">
            <WeightChart data={weightSeries} />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <CardLabel>Medidas corporales</CardLabel>
            <QuickAddMeasurement />
          </div>
          {Object.keys(measurements).length === 0 ? (
            <p className="mt-2 text-sm text-ink-soft">Todavía no registraste medidas.</p>
          ) : (
            <div className="mt-3 space-y-4">
              {Object.entries(measurements).map(([label, series]) => (
                <div key={label}>
                  <div className="flex items-baseline justify-between text-sm">
                    <span className="font-medium text-ink">{label}</span>
                    <span className="text-ink-soft">{series[series.length - 1].valueCm} cm</span>
                  </div>
                  <MeasurementChart data={series} />
                </div>
              ))}
            </div>
          )}
        </Card>

        {Object.keys(strength).length > 0 && (
          <Card>
            <CardLabel>Fuerza</CardLabel>
            <div className="mt-3 space-y-4">
              {Object.entries(strength).map(([name, series]) => (
                <div key={name}>
                  <span className="text-sm font-medium text-ink">{name}</span>
                  <StrengthChart data={series} />
                </div>
              ))}
            </div>
          </Card>
        )}

        <Card>
          <CardLabel>Volumen semanal</CardLabel>
          <div className="mt-3">
            <VolumeChart data={weeklyVolume} />
          </div>
        </Card>

        <Card>
          <CardLabel>Frecuencia de entrenamiento</CardLabel>
          <div className="mt-3">
            <FrequencyChart data={weeklyFrequency} />
          </div>
        </Card>

        <Card>
          <CardLabel>Grupos musculares (últimas 4 semanas)</CardLabel>
          <div className="mt-3">
            <MuscleGroupChart data={muscleVolume} />
          </div>
        </Card>
      </div>
    </div>
  );
}
