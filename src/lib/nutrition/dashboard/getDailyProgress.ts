import type { Meal, NutritionGoals } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";

export interface NutrientTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

export interface DailyProgress {
  meals: Meal[];
  consumed: NutrientTotals;
  waterLiters: number;
  goals: NutritionGoals | null;
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

export async function getDailyProgress(userId: string, date = new Date()): Promise<DailyProgress> {
  const dayStart = startOfDay(date);
  const dayEnd = endOfDay(date);

  const [meals, waterEntries, goals] = await Promise.all([
    prisma.meal.findMany({
      where: { userId, loggedAt: { gte: dayStart, lte: dayEnd } },
      orderBy: { loggedAt: "asc" },
    }),
    prisma.waterEntry.findMany({
      where: { userId, loggedAt: { gte: dayStart, lte: dayEnd } },
    }),
    prisma.nutritionGoals.findUnique({ where: { userId } }),
  ]);

  const consumed = meals.reduce<NutrientTotals>(
    (acc, meal) => ({
      calories: acc.calories + meal.totalCalories,
      protein: acc.protein + meal.totalProtein,
      carbs: acc.carbs + meal.totalCarbs,
      fat: acc.fat + meal.totalFat,
      fiber: acc.fiber + meal.totalFiber,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
  );

  const waterMl = waterEntries.reduce((sum, entry) => sum + entry.amountMl, 0);

  return { meals, consumed, waterLiters: waterMl / 1000, goals };
}
