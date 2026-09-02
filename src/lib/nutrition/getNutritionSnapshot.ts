import { prisma } from "@/lib/db/prisma";
import { getDailyProgress } from "./dashboard/getDailyProgress";

export type NutritionSnapshot =
  | { hasGoals: false }
  | { hasGoals: true; consumedCalories: number; goalCalories: number; remaining: number };

/** Versión compacta del dashboard de /nutrition, para widgets como el Home. */
export async function getNutritionSnapshot(userId: string): Promise<NutritionSnapshot> {
  const profile = await prisma.nutritionProfile.findUnique({ where: { userId } });
  if (!profile) return { hasGoals: false };

  const { consumed, goals } = await getDailyProgress(userId);
  if (!goals) return { hasGoals: false };

  return {
    hasGoals: true,
    consumedCalories: Math.round(consumed.calories),
    goalCalories: goals.calories,
    remaining: Math.round(goals.calories - consumed.calories),
  };
}
