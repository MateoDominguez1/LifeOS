import type { NutritionGoals } from "@/generated/prisma/client";
import type { NutrientTotals } from "./getDailyProgress";

export interface Insight {
  level: "green" | "yellow" | "red" | "neutral";
  text: string;
}

export function generateInsights(consumed: NutrientTotals, goals: NutritionGoals): Insight[] {
  const insights: Insight[] = [];

  const remainingCalories = goals.calories - consumed.calories;
  const proteinRatio = goals.protein > 0 ? consumed.protein / goals.protein : 0;
  const fatRatio = goals.fat > 0 ? consumed.fat / goals.fat : 0;

  if (fatRatio >= 1) {
    insights.push({
      level: "red",
      text: "Ya alcanzaste tu objetivo de grasas. Si vas a comer nuevamente, una opción más conveniente sería algo bajo en grasas.",
    });
  }

  if (remainingCalories > 0 && remainingCalories <= 400 && proteinRatio < 0.85) {
    const remainingProtein = Math.max(Math.round(goals.protein - consumed.protein), 0);
    insights.push({
      level: "yellow",
      text: `Te quedan pocas calorías (≈${Math.round(remainingCalories)} kcal) pero todavía necesitás aproximadamente ${remainingProtein} g de proteína.`,
    });
  }

  if (proteinRatio >= 0.9 && proteinRatio <= 1.15) {
    insights.push({ level: "green", text: "Vas muy bien con las proteínas." });
  }

  if (remainingCalories < 0) {
    insights.push({
      level: "yellow",
      text: `Superaste tu objetivo de calorías por ≈${Math.round(Math.abs(remainingCalories))} kcal hoy.`,
    });
  }

  if (insights.length === 0) {
    insights.push({ level: "neutral", text: "Vas dentro de lo esperado hoy." });
  }

  return insights;
}
