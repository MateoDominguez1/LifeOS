export type Sex = "MALE" | "FEMALE" | "OTHER";

export type ActivityLevel = "SEDENTARY" | "LIGHT" | "MODERATE" | "ACTIVE" | "VERY_ACTIVE";

export type GoalType = "LOSE_FAT" | "GAIN_MUSCLE" | "MAINTAIN" | "RECOMPOSITION" | "IMPROVE_DIET" | "OTHER";

export interface BMRInput {
  sex: Sex;
  age: number;
  heightCm: number;
  weightKg: number;
}

export interface MacroTargets {
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

export interface NutritionGoalsResult extends MacroTargets {
  calories: number;
  water: number;
}

export interface NutritionGoalsInput {
  sex: Sex;
  age: number;
  heightCm: number;
  weightKg: number;
  activityLevel: ActivityLevel;
  goalType: GoalType;
  goalRateKgPerWeek?: number;
}
