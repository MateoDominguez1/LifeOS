import type {
  EquipmentType,
  Exercise,
  ExperienceLevel,
  FitnessGoalType,
  RirRpeMode,
  WorkoutSet,
} from "@/generated/prisma/client";

/** Everything the plan generator needs from `FitnessProfile` — all these
 * fields live there in LifeOS's split schema (age/sex/height/weight don't,
 * they're on BodyProfile/WeightEntry and aren't needed for plan generation). */
export interface UserContext {
  userId: string;
  level: ExperienceLevel | null;
  primaryGoal: FitnessGoalType | null;
  daysPerWeek: number | null;
  trainingDays: number[];
  sessionDurationMin: number | null;
  equipment: EquipmentType[];
  favoriteExerciseIds: string[];
  excludedExerciseIds: string[];
  priorityMuscles: string[];
  rirRpeMode: RirRpeMode;
}

export interface GeneratedExercise {
  exerciseId: string;
  order: number;
  targetSets: number;
  targetRepsMin: number;
  targetRepsMax: number;
  restSeconds: number;
  targetRir: number | null;
  targetRpe: number | null;
}

export interface GeneratedDay {
  dayOfWeek: number;
  label: string;
  order: number;
  exercises: GeneratedExercise[];
}

export interface GeneratedPlan {
  name: string;
  days: GeneratedDay[];
}

export interface WeightSuggestion {
  action: "increase" | "maintain" | "decrease";
  suggestedWeightKg: number | null;
  reason: string;
}

export interface PlateauInsight {
  isPlateaued: boolean;
  sessionsAtSameWeight: number;
  message: string;
}

export interface AIProvider {
  generateWorkoutPlan(ctx: UserContext, exercisePool: Exercise[], planName?: string): GeneratedPlan;
  suggestWeight(targetRepsMin: number, targetRepsMax: number, targetRir: number | null, history: WorkoutSet[]): WeightSuggestion;
  suggestExerciseReplacement(exercise: Exercise, availablePool: Exercise[]): Exercise[];
}
