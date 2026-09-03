import { prisma } from "@/lib/db/prisma";
import { getTodaysWorkoutDay, getWeekRange } from "./today";
import { deriveDayType, DAY_TYPE_LABELS_ES } from "./day-type";

export type FitnessSnapshot =
  | { hasProfile: false }
  | {
      hasProfile: true;
      todayLabel: string | null;
      todayCompleted: boolean;
      weeklyCompleted: number;
      weeklyGoal: number;
    };

/** Versión compacta del dashboard de /fitness, para widgets como el Home. */
export async function getFitnessSnapshot(userId: string): Promise<FitnessSnapshot> {
  const profile = await prisma.fitnessProfile.findUnique({ where: { userId } });
  if (!profile) return { hasProfile: false };

  const { start, end } = getWeekRange();
  const [todays, weeklyCompleted] = await Promise.all([
    getTodaysWorkoutDay(userId),
    prisma.workoutSession.count({ where: { userId, completedAt: { gte: start, lt: end } } }),
  ]);

  let todayCompleted = false;
  if (todays?.day) {
    const session = await prisma.workoutSession.findFirst({
      where: { userId, workoutDayId: todays.day.id, startedAt: { gte: start, lt: end } },
      select: { completedAt: true },
    });
    todayCompleted = !!session?.completedAt;
  }

  return {
    hasProfile: true,
    todayLabel: todays?.day
      ? DAY_TYPE_LABELS_ES[deriveDayType(todays.day.exercises.map((we) => we.exercise))]
      : null,
    todayCompleted,
    weeklyCompleted,
    weeklyGoal: profile.daysPerWeek ?? 3,
  };
}
