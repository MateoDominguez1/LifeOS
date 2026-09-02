import { prisma } from "@/lib/db/prisma";
import { estimate1RM } from "../calculations";
import { getWeekRange } from "../today";

function toDateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function weekKey(d: Date): string {
  return toDateKey(getWeekRange(d).start);
}

export async function getWeightHistory(userId: string, days = 90) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const entries = await prisma.weightEntry.findMany({
    where: { userId, loggedAt: { gte: since } },
    orderBy: { loggedAt: "asc" },
  });

  return entries.map((e) => ({ date: toDateKey(e.loggedAt), weightKg: e.weightKg }));
}

export async function getMeasurementHistory(userId: string) {
  const measurements = await prisma.bodyMeasurement.findMany({
    where: { userId },
    orderBy: { loggedAt: "asc" },
  });

  const grouped: Record<string, { date: string; valueCm: number }[]> = {};
  for (const m of measurements) {
    const label = m.type === "CUSTOM" ? m.customLabel ?? "Custom" : m.type;
    (grouped[label] ??= []).push({ date: toDateKey(m.loggedAt), valueCm: m.valueCm });
  }
  return grouped;
}

const PRIORITY_EXERCISE_NAMES = ["Barbell Bench Press", "Back Squat", "Deadlift", "Barbell Shoulder Press"];

export async function getStrengthHistory(userId: string, limit = 3) {
  const trained = await prisma.exercise.findMany({
    where: {
      workoutExercises: {
        some: { sets: { some: { session: { userId, completedAt: { not: null } } } } },
      },
    },
  });

  const sorted = [...trained].sort((a, b) => {
    const aPriority = PRIORITY_EXERCISE_NAMES.includes(a.name) ? 0 : 1;
    const bPriority = PRIORITY_EXERCISE_NAMES.includes(b.name) ? 0 : 1;
    return aPriority - bPriority;
  });
  const chosen = sorted.slice(0, limit);

  const result: Record<string, { date: string; estimated1RM: number }[]> = {};

  for (const exercise of chosen) {
    const sets = await prisma.workoutSet.findMany({
      where: {
        completed: true,
        workoutExercise: { exerciseId: exercise.id },
        session: { userId, completedAt: { not: null } },
      },
      include: { session: true },
    });

    const bySession = new Map<string, number>();
    for (const set of sets) {
      const date = toDateKey(set.session.startedAt);
      const value = estimate1RM(set.weightKg, set.reps);
      bySession.set(date, Math.max(bySession.get(date) ?? 0, value));
    }

    result[exercise.name] = [...bySession.entries()]
      .map(([date, v]) => ({ date, estimated1RM: Math.round(v * 10) / 10 }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  return result;
}

export async function getWeeklyVolume(userId: string, weeks = 8) {
  const since = new Date();
  since.setDate(since.getDate() - weeks * 7);

  const sets = await prisma.workoutSet.findMany({
    where: { completed: true, session: { userId, completedAt: { gte: since } } },
    include: { session: true },
  });

  const byWeek = new Map<string, number>();
  for (const set of sets) {
    const key = weekKey(set.session.startedAt);
    byWeek.set(key, (byWeek.get(key) ?? 0) + set.weightKg * set.reps);
  }

  return [...byWeek.entries()]
    .map(([week, volume]) => ({ week, volume: Math.round(volume) }))
    .sort((a, b) => a.week.localeCompare(b.week));
}

export async function getWeeklyFrequency(userId: string, weeks = 8) {
  const since = new Date();
  since.setDate(since.getDate() - weeks * 7);

  const sessions = await prisma.workoutSession.findMany({
    where: { userId, completedAt: { gte: since } },
  });

  const byWeek = new Map<string, number>();
  for (const s of sessions) {
    const key = weekKey(s.completedAt!);
    byWeek.set(key, (byWeek.get(key) ?? 0) + 1);
  }

  return [...byWeek.entries()]
    .map(([week, count]) => ({ week, count }))
    .sort((a, b) => a.week.localeCompare(b.week));
}

export async function getMuscleGroupVolume(userId: string, days = 28) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const sets = await prisma.workoutSet.findMany({
    where: { completed: true, session: { userId, completedAt: { gte: since } } },
    include: { workoutExercise: { include: { exercise: true } } },
  });

  const byMuscle = new Map<string, number>();
  for (const set of sets) {
    const volume = set.weightKg * set.reps;
    for (const muscle of set.workoutExercise.exercise.muscleGroups) {
      byMuscle.set(muscle, (byMuscle.get(muscle) ?? 0) + volume);
    }
  }

  return [...byMuscle.entries()]
    .map(([muscle, volume]) => ({ muscle, volume: Math.round(volume) }))
    .sort((a, b) => b.volume - a.volume);
}
