import { prisma } from "@/lib/db/prisma";

export type Compliance = "green" | "yellow" | "red" | "none";

export interface DayHistory {
  date: Date;
  totalCalories: number;
  totalProtein: number;
  weightKg: number | null;
  compliance: Compliance;
}

export function complianceFor(consumed: number, goal: number): Compliance {
  if (consumed === 0) return "none";
  const ratio = consumed / goal;
  if (ratio >= 0.95 && ratio <= 1.05) return "green";
  if (ratio >= 0.85 && ratio <= 1.15) return "yellow";
  return "red";
}

export async function getMonthlyHistory(
  userId: string,
  year: number,
  month: number
): Promise<DayHistory[]> {
  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 0, 23, 59, 59, 999);

  const [meals, weightEntries, goals] = await Promise.all([
    prisma.meal.findMany({
      where: { userId, loggedAt: { gte: monthStart, lte: monthEnd } },
    }),
    prisma.weightEntry.findMany({
      where: { userId, loggedAt: { gte: monthStart, lte: monthEnd } },
      orderBy: { loggedAt: "asc" },
    }),
    prisma.nutritionGoals.findUnique({ where: { userId } }),
  ]);

  const daysInMonth = monthEnd.getDate();
  const calorieGoal = goals?.calories ?? 2000;

  const days: DayHistory[] = [];
  for (let day = 1; day <= daysInMonth; day++) {
    const dayStart = new Date(year, month, day);
    const dayEnd = new Date(year, month, day, 23, 59, 59, 999);

    const dayMeals = meals.filter((m) => m.loggedAt >= dayStart && m.loggedAt <= dayEnd);
    const totalCalories = dayMeals.reduce((sum, m) => sum + m.totalCalories, 0);
    const totalProtein = dayMeals.reduce((sum, m) => sum + m.totalProtein, 0);

    const dayWeight = weightEntries.find((w) => w.loggedAt >= dayStart && w.loggedAt <= dayEnd);

    days.push({
      date: dayStart,
      totalCalories,
      totalProtein,
      weightKg: dayWeight?.weightKg ?? null,
      compliance: complianceFor(totalCalories, calorieGoal),
    });
  }

  return days;
}
