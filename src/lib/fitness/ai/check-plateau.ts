import { prisma } from "@/lib/db/prisma";
import { detectPlateau } from "./rules-provider";

const LOOKBACK_SESSIONS = 6;

export async function checkPlateauForSession(userId: string, sessionId: string): Promise<void> {
  const session = await prisma.workoutSession.findUnique({
    where: { id: sessionId },
    include: { sets: { where: { completed: true }, include: { workoutExercise: true } } },
  });
  if (!session) return;

  const exerciseIds = [...new Set(session.sets.map((s) => s.workoutExercise.exerciseId))];

  for (const exerciseId of exerciseIds) {
    const recentSessions = await prisma.workoutSession.findMany({
      where: {
        userId,
        completedAt: { not: null },
        sets: { some: { workoutExercise: { exerciseId } } },
      },
      orderBy: { startedAt: "desc" },
      take: LOOKBACK_SESSIONS,
      include: { sets: { where: { workoutExercise: { exerciseId } } } },
    });

    const topWeights = recentSessions
      .map((s) => Math.max(...s.sets.map((set) => set.weightKg), 0))
      .filter((w) => w > 0);

    if (topWeights.length < 2) continue;

    let sessionsAtSameWeight = 1;
    for (let i = 1; i < topWeights.length; i++) {
      if (topWeights[i] >= topWeights[0]) sessionsAtSameWeight++;
      else break;
    }

    const { isPlateaued, message } = detectPlateau(sessionsAtSameWeight);
    if (!isPlateaued) continue;

    const existing = await prisma.aIRecommendation.findFirst({
      where: {
        userId,
        type: "PLATEAU_DETECTED",
        status: "PENDING",
        payload: { path: ["exerciseId"], equals: exerciseId },
      },
    });
    if (existing) continue;

    const exercise = await prisma.exercise.findUnique({ where: { id: exerciseId } });

    await prisma.aIRecommendation.create({
      data: {
        userId,
        type: "PLATEAU_DETECTED",
        payload: { exerciseId, exerciseName: exercise?.name ?? "", sessionsAtSameWeight, message },
      },
    });
  }
}
