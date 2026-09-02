import type { ActivityLevel, BMRInput, GoalType, MacroTargets, NutritionGoalsInput, NutritionGoalsResult } from "./types";

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  SEDENTARY: 1.2,
  LIGHT: 1.375,
  MODERATE: 1.55,
  ACTIVE: 1.725,
  VERY_ACTIVE: 1.9,
};

const KCAL_PER_KG_BODY_FAT = 7700;
const DEFAULT_DEFICIT_RATIO = 0.2;
const DEFAULT_SURPLUS_RATIO = 0.1;
const FIBER_PER_1000_KCAL = 14;
const FAT_RATIO_OF_CALORIES = 0.25;

/** Mifflin-St Jeor equation. */
export function calculateBMR({ sex, age, heightCm, weightKg }: BMRInput): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  if (sex === "MALE") return base + 5;
  if (sex === "FEMALE") return base - 161;
  return base - 78;
}

export function calculateTDEE(bmr: number, activityLevel: ActivityLevel): number {
  return bmr * ACTIVITY_MULTIPLIERS[activityLevel];
}

export function calculateCalorieTarget(tdee: number, goalType: GoalType, goalRateKgPerWeek?: number): number {
  switch (goalType) {
    case "LOSE_FAT": {
      const dailyDeficit = goalRateKgPerWeek ? (goalRateKgPerWeek * KCAL_PER_KG_BODY_FAT) / 7 : tdee * DEFAULT_DEFICIT_RATIO;
      return Math.round(tdee - dailyDeficit);
    }
    case "GAIN_MUSCLE": {
      const dailySurplus = goalRateKgPerWeek ? (goalRateKgPerWeek * KCAL_PER_KG_BODY_FAT) / 7 : tdee * DEFAULT_SURPLUS_RATIO;
      return Math.round(tdee + dailySurplus);
    }
    case "RECOMPOSITION":
      return Math.round(tdee * 0.95);
    case "MAINTAIN":
    case "IMPROVE_DIET":
    case "OTHER":
    default:
      return Math.round(tdee);
  }
}

export function calculateMacroTargets(calories: number, weightKg: number, goalType: GoalType): MacroTargets {
  const proteinPerKg = goalType === "LOSE_FAT" || goalType === "RECOMPOSITION" ? 2.0 : goalType === "GAIN_MUSCLE" ? 1.8 : 1.6;

  const protein = Math.round(weightKg * proteinPerKg);
  const fatCalories = calories * FAT_RATIO_OF_CALORIES;
  const fat = Math.round(fatCalories / 9);
  const proteinCalories = protein * 4;
  const carbsCalories = Math.max(calories - proteinCalories - fatCalories, 0);
  const carbs = Math.round(carbsCalories / 4);
  const fiber = Math.round((calories / 1000) * FIBER_PER_1000_KCAL);

  return { protein, carbs, fat, fiber };
}

export function calculateWaterTarget(weightKg: number, activityLevel: ActivityLevel): number {
  const base = weightKg * 0.033;
  const activityBonus = activityLevel === "ACTIVE" || activityLevel === "VERY_ACTIVE" ? 0.5 : activityLevel === "MODERATE" ? 0.3 : 0;
  return Math.round((base + activityBonus) * 10) / 10;
}

export function calculateNutritionGoals(input: NutritionGoalsInput): NutritionGoalsResult {
  const bmr = calculateBMR(input);
  const tdee = calculateTDEE(bmr, input.activityLevel);
  const calories = calculateCalorieTarget(tdee, input.goalType, input.goalRateKgPerWeek);
  const macros = calculateMacroTargets(calories, input.weightKg, input.goalType);
  const water = calculateWaterTarget(input.weightKg, input.activityLevel);

  return { calories, ...macros, water };
}
