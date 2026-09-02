import type { EquipmentType, ExperienceLevel, FitnessGoalType, RirRpeMode, Sex } from "@/generated/prisma/client";

export interface OnboardingData {
  age: number | null;
  sex: Sex | null;
  heightCm: number | null;
  weightKg: number | null;
  weightGoalKg: number | null;
  level: ExperienceLevel | null;

  primaryGoal: FitnessGoalType | null;
  secondaryGoals: FitnessGoalType[];

  trainingDays: number[];
  sessionDurationMin: number;

  equipment: EquipmentType[];

  priorityMuscles: string[];
  cardioPreference: boolean;
  rirRpeMode: RirRpeMode;
  favoriteExerciseIds: string[];
  excludedExerciseIds: string[];

  limitations: string;
}

export const INITIAL_ONBOARDING_DATA: OnboardingData = {
  age: null,
  sex: null,
  heightCm: null,
  weightKg: null,
  weightGoalKg: null,
  level: null,

  primaryGoal: null,
  secondaryGoals: [],

  trainingDays: [],
  sessionDurationMin: 60,

  equipment: [],

  priorityMuscles: [],
  cardioPreference: false,
  rirRpeMode: "RIR",
  favoriteExerciseIds: [],
  excludedExerciseIds: [],

  limitations: "",
};
