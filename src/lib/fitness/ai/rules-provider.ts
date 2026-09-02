import type { Exercise, WorkoutSet } from "@/generated/prisma/client";
import type { AIProvider, GeneratedDay, GeneratedPlan, UserContext, WeightSuggestion } from "../types";
import { getGoalScheme } from "./goal-schemes";
import { getSplitTemplate } from "./split-templates";

const WEIGHT_INCREMENT_KG = 2.5;
const PLATEAU_SESSION_THRESHOLD = 4;

function exerciseMatchesEquipment(exercise: Exercise, userEquipment: string[]): boolean {
  if (userEquipment.length === 0) return true;
  if (exercise.equipment.includes("BODYWEIGHT")) return true;
  return exercise.equipment.some((e) => userEquipment.includes(e));
}

function pickExercisesForDay(
  pool: Exercise[],
  categories: string[],
  count: number,
  favoriteIds: string[],
  priorityMuscles: string[],
  usageCount: Map<string, number>
): Exercise[] {
  const candidatesByCategory = categories.map((category) =>
    pool.filter((e) => e.muscleGroups.includes(category.toLowerCase()))
  );

  const chosen: Exercise[] = [];
  const chosenIds = new Set<string>();
  let categoryIndex = 0;
  let guard = count * categories.length * 2;

  while (chosen.length < count && guard-- > 0) {
    if (categoryIndex >= categories.length * count && chosen.length < count) break;

    const candidates = candidatesByCategory[categoryIndex % candidatesByCategory.length];
    const scored = candidates
      .filter((e) => !chosenIds.has(e.id))
      .map((e) => {
        let score = 0;
        if (favoriteIds.includes(e.id)) score += 10;
        if (e.muscleGroups.some((m) => priorityMuscles.includes(m))) score += 5;
        score -= (usageCount.get(e.id) ?? 0) * 20;
        return { exercise: e, score };
      })
      .sort((a, b) => b.score - a.score);

    if (scored.length > 0) {
      const best = scored[0].exercise;
      chosen.push(best);
      chosenIds.add(best.id);
      usageCount.set(best.id, (usageCount.get(best.id) ?? 0) + 1);
    }

    categoryIndex++;
  }

  return chosen;
}

class RulesProvider implements AIProvider {
  generateWorkoutPlan(ctx: UserContext, exercisePool: Exercise[], planName?: string): GeneratedPlan {
    const eligiblePool = exercisePool.filter(
      (e) => !ctx.excludedExerciseIds.includes(e.id) && exerciseMatchesEquipment(e, ctx.equipment)
    );

    const daysPerWeek = ctx.daysPerWeek ?? 3;
    const template = getSplitTemplate(daysPerWeek, ctx.level);
    const scheme = getGoalScheme(ctx.primaryGoal);
    const exerciseCount = Math.min(Math.max(Math.round((ctx.sessionDurationMin ?? 60) / 10), 4), 8);

    const trainingDays =
      ctx.trainingDays.length === template.length ? ctx.trainingDays : template.map((_, i) => i);

    const usageCount = new Map<string, number>();

    const days: GeneratedDay[] = template.map((dayTemplate, i) => {
      const picked = pickExercisesForDay(
        eligiblePool,
        dayTemplate.categories,
        exerciseCount,
        ctx.favoriteExerciseIds,
        ctx.priorityMuscles,
        usageCount
      );

      return {
        dayOfWeek: trainingDays[i],
        label: dayTemplate.label,
        order: i,
        exercises: picked.map((exercise, order) => ({
          exerciseId: exercise.id,
          order,
          targetSets: scheme.sets,
          targetRepsMin: scheme.repsMin,
          targetRepsMax: scheme.repsMax,
          restSeconds: scheme.restSeconds,
          targetRir: ctx.rirRpeMode === "RIR" ? scheme.rir : null,
          targetRpe: ctx.rirRpeMode === "RPE" ? 10 - scheme.rir : null,
        })),
      };
    });

    return { name: planName ?? "My routine", days };
  }

  suggestWeight(targetRepsMin: number, targetRepsMax: number, targetRir: number | null, history: WorkoutSet[]): WeightSuggestion {
    if (history.length === 0) {
      return {
        action: "maintain",
        suggestedWeightKg: null,
        reason: "No previous data for this exercise yet — start with a comfortable weight and record it.",
      };
    }

    const lastWeight = history[0].weightKg;
    const hitRepCeiling = history.every((s) => s.reps >= targetRepsMax);
    const easyEffort = targetRir === null || history.every((s) => (s.rir ?? targetRir) >= targetRir);
    const missedFloor = history.some((s) => s.reps < targetRepsMin);

    if (hitRepCeiling && easyEffort) {
      const suggested = lastWeight + WEIGHT_INCREMENT_KG;
      return {
        action: "increase",
        suggestedWeightKg: suggested,
        reason: `You hit ${targetRepsMax}+ reps across all sets with room to spare — try ${suggested}kg next session.`,
      };
    }

    if (missedFloor) {
      return {
        action: "maintain",
        suggestedWeightKg: lastWeight,
        reason: `You didn't reach ${targetRepsMin} reps on every set — keep the same weight and focus on completing the range.`,
      };
    }

    return {
      action: "maintain",
      suggestedWeightKg: lastWeight,
      reason: "You're in range but not yet at the rep ceiling — keep the weight and aim for more reps.",
    };
  }

  suggestExerciseReplacement(exercise: Exercise, availablePool: Exercise[]): Exercise[] {
    return availablePool
      .filter((e) => e.id !== exercise.id && e.muscleGroups.some((m) => exercise.muscleGroups.includes(m)))
      .slice(0, 5);
  }
}

export function detectPlateau(sessionsAtSameWeight: number): { isPlateaued: boolean; message: string } {
  const isPlateaued = sessionsAtSameWeight >= PLATEAU_SESSION_THRESHOLD;
  return {
    isPlateaued,
    message: isPlateaued
      ? `You've been stuck at the same weight for ${sessionsAtSameWeight} sessions. Consider a slight deload and rebuilding your reps.`
      : "",
  };
}

export const aiProvider: AIProvider = new RulesProvider();
