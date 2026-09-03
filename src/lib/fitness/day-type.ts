const PUSH_GROUPS = ["chest", "shoulders", "triceps"];
const PULL_GROUPS = ["back", "biceps"];
const LEGS_GROUPS = ["quads", "hamstrings", "glutes", "calves"];

export type DayTypeKey = "empty" | "push" | "pull" | "legs" | "upper" | "fullBody" | "mixed";

/** Derives a workout-type label purely from a day's currently assigned
 * exercises (their muscle groups) rather than trusting a static label set
 * at generation time — so it stays accurate after the user edits exercises. */
export function deriveDayType(exercises: { muscleGroups: string[] }[]): DayTypeKey {
  if (exercises.length === 0) return "empty";

  let hasPush = false;
  let hasPull = false;
  let hasLegs = false;

  for (const exercise of exercises) {
    const groups = exercise.muscleGroups.map((g) => g.toLowerCase());
    if (groups.some((g) => PUSH_GROUPS.includes(g))) hasPush = true;
    if (groups.some((g) => PULL_GROUPS.includes(g))) hasPull = true;
    if (groups.some((g) => LEGS_GROUPS.includes(g))) hasLegs = true;
  }

  const bucketCount = [hasPush, hasPull, hasLegs].filter(Boolean).length;

  if (bucketCount === 0) return "mixed";
  if (bucketCount === 3) return "fullBody";
  if (hasPush && hasPull) return "upper";
  if (hasLegs) return "legs";
  if (hasPush) return "push";
  return "pull";
}

export const DAY_TYPE_LABELS_ES: Record<DayTypeKey, string> = {
  empty: "Sin ejercicios",
  push: "Push",
  pull: "Pull",
  legs: "Piernas",
  upper: "Tren superior",
  fullBody: "Full body",
  mixed: "Mixto",
};
