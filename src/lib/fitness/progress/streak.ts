import { prisma } from "@/lib/db/prisma";
import { getWeekRange } from "../today";

export async function computeWorkoutStreak(userId: string, weeklyGoal: number): Promise<number> {
  if (weeklyGoal <= 0) return 0;

  let streak = 0;
  let weekOffset = 0;

  while (streak < 104) {
    const reference = new Date();
    reference.setDate(reference.getDate() + weekOffset * 7);
    const { start, end } = getWeekRange(reference);

    const count = await prisma.workoutSession.count({
      where: { userId, completedAt: { gte: start, lt: end } },
    });

    if (weekOffset === 0) {
      if (count < weeklyGoal) {
        weekOffset -= 1;
        continue;
      }
    } else if (count < weeklyGoal) {
      break;
    }

    streak += 1;
    weekOffset -= 1;
  }

  return streak;
}
