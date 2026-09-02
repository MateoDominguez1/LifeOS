import { prisma } from "@/lib/db/prisma";

export interface WeekRange {
  start: Date;
  end: Date;
}

/** Sunday-start local week, reused by session dedup, streak counting, and analytics. */
export function getWeekRange(date = new Date()): WeekRange {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - start.getDay());
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  return { start, end };
}

export async function getActiveProgram(userId: string, managedProfileId: string | null = null) {
  return prisma.workoutProgram.findFirst({
    where: { userId, managedProfileId, active: true },
    include: {
      days: {
        orderBy: { order: "asc" },
        include: {
          exercises: {
            where: { removedAt: null },
            orderBy: { order: "asc" },
            include: { exercise: true },
          },
        },
      },
    },
  });
}

export async function getTodaysWorkoutDay(userId: string, managedProfileId: string | null = null) {
  const program = await getActiveProgram(userId, managedProfileId);
  if (!program) return null;
  const day = program.days.find((d) => d.dayOfWeek === new Date().getDay()) ?? null;
  return { program, day };
}
