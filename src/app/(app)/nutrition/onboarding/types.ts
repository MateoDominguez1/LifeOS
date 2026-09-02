import type { ActivityLevel, GoalType, Sex } from "@/lib/nutrition/types";

export interface OnboardingData {
  age: number | null;
  sex: Sex | null;
  heightCm: number | null;
  weightKg: number | null;
  weightGoalKg: number | null;

  activityLevel: ActivityLevel | null;
  isSedentaryJob: boolean;
  trainingDaysPerWeek: number | null;
  trainingDurationMin: number | null;
  otherSports: string;

  goalType: GoalType | null;
  goalRateKgPerWeek: number | null;
  goalTargetDate: string;

  mealsPerDay: number | null;
  dietaryPreference: string;
  allergies: string;
  dietType: string;
  favoriteFoods: string;
  limitedFoods: string;

  trackCalories: boolean;
  trackProtein: boolean;
  trackCarbs: boolean;
  trackFat: boolean;
  trackFiber: boolean;
  trackWater: boolean;
  trackSugar: boolean;
  trackMicronutrients: boolean;

  manualCalories: number | null;
  manualProtein: number | null;
  manualCarbs: number | null;
  manualFat: number | null;
  manualFiber: number | null;
  manualWater: number | null;
  isManualOverride: boolean;
}

export const INITIAL_ONBOARDING_DATA: OnboardingData = {
  age: null,
  sex: null,
  heightCm: null,
  weightKg: null,
  weightGoalKg: null,

  activityLevel: null,
  isSedentaryJob: true,
  trainingDaysPerWeek: null,
  trainingDurationMin: null,
  otherSports: "",

  goalType: null,
  goalRateKgPerWeek: null,
  goalTargetDate: "",

  mealsPerDay: null,
  dietaryPreference: "",
  allergies: "",
  dietType: "",
  favoriteFoods: "",
  limitedFoods: "",

  trackCalories: true,
  trackProtein: true,
  trackCarbs: true,
  trackFat: true,
  trackFiber: true,
  trackWater: true,
  trackSugar: true,
  trackMicronutrients: true,

  manualCalories: null,
  manualProtein: null,
  manualCarbs: null,
  manualFat: null,
  manualFiber: null,
  manualWater: null,
  isManualOverride: false,
};

export function splitList(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}
