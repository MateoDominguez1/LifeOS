import { prisma } from "@/lib/db/prisma";

export interface Stats {
  avgCalories: number;
  avgProtein: number;
  complianceRate: number | null;
  weightSeries: { date: string; weightKg: number }[];
  currentWeight: number | null;
  weightGoal: number | null;
  daysLogged: number;
}

export async function getStats(userId: string, days = 30): Promise<Stats> {
  const since = new Date();
  since.setDate(since.getDate() - days);
  since.setHours(0, 0, 0, 0);

  const [meals, weightEntries, goals, latestWeight, weightGoalRow] = await Promise.all([
    prisma.meal.findMany({ where: { userId, loggedAt: { gte: since } } }),
    prisma.weightEntry.findMany({
      where: { userId, loggedAt: { gte: since } },
      orderBy: { loggedAt: "asc" },
    }),
    prisma.nutritionGoals.findUnique({ where: { userId } }),
    prisma.weightEntry.findFirst({ where: { userId }, orderBy: { loggedAt: "desc" } }),
    prisma.goal.findFirst({
      where: { userId, domain: "BODY", metric: "BODY_WEIGHT", status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const byDay = new Map<string, { calories: number; protein: number }>();
  for (const meal of meals) {
    const key = meal.loggedAt.toISOString().slice(0, 10);
    const prev = byDay.get(key) ?? { calories: 0, protein: 0 };
    byDay.set(key, {
      calories: prev.calories + meal.totalCalories,
      protein: prev.protein + meal.totalProtein,
    });
  }

  const dayTotals = Array.from(byDay.values());
  const daysLogged = dayTotals.length;

  const avgCalories = daysLogged > 0 ? dayTotals.reduce((s, d) => s + d.calories, 0) / daysLogged : 0;
  const avgProtein = daysLogged > 0 ? dayTotals.reduce((s, d) => s + d.protein, 0) / daysLogged : 0;

  let complianceRate: number | null = null;
  if (goals && daysLogged > 0) {
    const onTarget = dayTotals.filter((d) => {
      const ratio = d.calories / goals.calories;
      return ratio >= 0.85 && ratio <= 1.15;
    }).length;
    complianceRate = Math.round((onTarget / daysLogged) * 100);
  }

  const weightSeries = weightEntries.map((w) => ({
    date: w.loggedAt.toISOString().slice(0, 10),
    weightKg: w.weightKg,
  }));

  const currentWeight = weightSeries.length > 0 ? weightSeries[weightSeries.length - 1].weightKg : (latestWeight?.weightKg ?? null);

  return {
    avgCalories: Math.round(avgCalories),
    avgProtein: Math.round(avgProtein),
    complianceRate,
    weightSeries,
    currentWeight,
    weightGoal: weightGoalRow ? Number(weightGoalRow.targetValue) : null,
    daysLogged,
  };
}
