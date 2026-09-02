import type { FitnessGoalType } from "@/generated/prisma/client";

export interface GoalScheme {
  sets: number;
  repsMin: number;
  repsMax: number;
  restSeconds: number;
  rir: number;
}

const SCHEMES: Record<FitnessGoalType, GoalScheme> = {
  GAIN_MUSCLE: { sets: 4, repsMin: 8, repsMax: 12, restSeconds: 90, rir: 2 },
  RECOMP: { sets: 3, repsMin: 8, repsMax: 12, restSeconds: 75, rir: 2 },
  GAIN_STRENGTH: { sets: 4, repsMin: 4, repsMax: 6, restSeconds: 180, rir: 1 },
  LOSE_FAT: { sets: 3, repsMin: 12, repsMax: 15, restSeconds: 60, rir: 2 },
  IMPROVE_CONDITIONING: { sets: 3, repsMin: 12, repsMax: 15, restSeconds: 45, rir: 3 },
  MAINTAIN: { sets: 3, repsMin: 8, repsMax: 12, restSeconds: 90, rir: 2 },
  OTHER: { sets: 3, repsMin: 8, repsMax: 12, restSeconds: 90, rir: 2 },
};

export function getGoalScheme(goal: FitnessGoalType | null): GoalScheme {
  return SCHEMES[goal ?? "OTHER"];
}
