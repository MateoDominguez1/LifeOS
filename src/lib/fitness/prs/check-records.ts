import type { PRType } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";
import { estimate1RM } from "../calculations";

const PR_TYPES: PRType[] = ["MAX_WEIGHT", "MAX_REPS", "MAX_VOLUME", "ESTIMATED_1RM"];

export interface NewPR {
  exerciseId: string;
  exerciseName: string;
  type: PRType;
  value: number;
}

export async function checkAndRecordPRs(userId: string, sessionId: string): Promise<NewPR[]> {
  const sets = await prisma.workoutSet.findMany({
    where: { sessionId, completed: true },
    include: { workoutExercise: { include: { exercise: true } } },
  });

  const byExercise = new Map<string, typeof sets>();
  for (const set of sets) {
    const exerciseId = set.workoutExercise.exerciseId;
    const list = byExercise.get(exerciseId) ?? [];
    list.push(set);
    byExercise.set(exerciseId, list);
  }

  const newPRs: NewPR[] = [];

  for (const [exerciseId, exerciseSets] of byExercise) {
    const exerciseName = exerciseSets[0].workoutExercise.exercise.name;

    const values: Record<PRType, number> = {
      MAX_WEIGHT: Math.max(...exerciseSets.map((s) => s.weightKg)),
      MAX_REPS: Math.max(...exerciseSets.map((s) => s.reps)),
      MAX_VOLUME: exerciseSets.reduce((sum, s) => sum + s.weightKg * s.reps, 0),
      ESTIMATED_1RM: Math.max(...exerciseSets.map((s) => estimate1RM(s.weightKg, s.reps))),
    };

    const existingRecords = await prisma.personalRecord.findMany({
      where: { userId, exerciseId, type: { in: PR_TYPES } },
      orderBy: { value: "desc" },
    });
    const bestByType = new Map<PRType, number>();
    for (const rec of existingRecords) {
      if (!bestByType.has(rec.type) || rec.value > bestByType.get(rec.type)!) {
        bestByType.set(rec.type, rec.value);
      }
    }

    for (const type of PR_TYPES) {
      const newValue = values[type];
      const existing = bestByType.get(type);
      if (existing === undefined || newValue > existing) {
        await prisma.personalRecord.create({
          data: { userId, exerciseId, type, value: newValue, sessionId },
        });
        newPRs.push({ exerciseId, exerciseName, type, value: newValue });
      }
    }
  }

  return newPRs;
}
