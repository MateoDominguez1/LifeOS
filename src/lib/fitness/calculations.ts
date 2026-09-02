/** Epley formula. Shared here since the original app defined this
 * independently in two files (progress analytics + PR detection). */
export function estimate1RM(weightKg: number, reps: number): number {
  return weightKg * (1 + reps / 30);
}
