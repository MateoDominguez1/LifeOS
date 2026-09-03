import { prisma } from "@/lib/db/prisma";
import { getT } from "@/lib/i18n";
import { getWeekRange } from "../today";
import { checkAndRecordPRs } from "../prs/check-records";
import { checkPlateauForSession } from "../ai/check-plateau";

export interface LogSetInput {
  sessionId: string;
  workoutExerciseId: string;
  setNumber: number;
  weightKg: number;
  reps: number;
  rir?: number;
  rpe?: number;
  notes?: string;
}

type ServiceResult = { success: true } | { error: string };
type StartSessionResult = { success: true; sessionId: string } | { error: string };

export async function startWorkoutSession(
  userId: string,
  workoutDayId: string,
  managedProfileId: string | null = null
): Promise<StartSessionResult> {
  const day = await prisma.workoutDay.findUnique({ where: { id: workoutDayId } });
  if (!day) {
    const { t } = await getT();
    return { error: t.fitness.workout.dayNotFoundError };
  }

  const { start, end } = getWeekRange();
  const existing = await prisma.workoutSession.findFirst({
    where: { userId, managedProfileId, workoutDayId, completedAt: null, startedAt: { gte: start, lt: end } },
  });
  if (existing) return { success: true, sessionId: existing.id };

  const session = await prisma.workoutSession.create({
    data: { userId, managedProfileId, workoutDayId },
  });
  return { success: true, sessionId: session.id };
}

export async function logSet(userId: string, input: LogSetInput): Promise<ServiceResult> {
  const session = await prisma.workoutSession.findUnique({ where: { id: input.sessionId } });
  if (!session || session.userId !== userId) {
    const { t } = await getT();
    return { error: t.fitness.common.notAuthorizedError };
  }
  if (session.completedAt) {
    const { t } = await getT();
    return { error: t.fitness.workout.alreadyFinishedError };
  }

  const existing = await prisma.workoutSet.findFirst({
    where: { sessionId: input.sessionId, workoutExerciseId: input.workoutExerciseId, setNumber: input.setNumber },
  });

  const data = {
    weightKg: input.weightKg,
    reps: input.reps,
    rir: input.rir ?? null,
    rpe: input.rpe ?? null,
    notes: input.notes ?? null,
    completed: true,
  };

  if (existing) {
    await prisma.workoutSet.update({ where: { id: existing.id }, data });
  } else {
    await prisma.workoutSet.create({
      data: { sessionId: input.sessionId, workoutExerciseId: input.workoutExerciseId, setNumber: input.setNumber, ...data },
    });
  }

  return { success: true };
}

export async function finishWorkoutSession(userId: string, sessionId: string): Promise<ServiceResult> {
  const session = await prisma.workoutSession.findUnique({ where: { id: sessionId } });
  if (!session || session.userId !== userId) {
    const { t } = await getT();
    return { error: t.fitness.common.notAuthorizedError };
  }
  if (session.completedAt) {
    const { t } = await getT();
    return { error: t.fitness.workout.alreadyFinishedError };
  }

  const completedAt = new Date();
  const durationSec = Math.round((completedAt.getTime() - session.startedAt.getTime()) / 1000);

  await prisma.workoutSession.update({ where: { id: sessionId }, data: { completedAt, durationSec } });

  await checkAndRecordPRs(userId, sessionId);
  await checkPlateauForSession(userId, sessionId);

  return { success: true };
}

/** Lets the user directly mark a scheduled day as done, without going
 * through the set-by-set logging flow (e.g. logging after the fact, or a
 * session they don't want to track in detail). No sets are created, so no
 * PR/plateau check runs — there's nothing to check. */
export async function markWorkoutDone(
  userId: string,
  workoutDayId: string,
  date: Date,
  managedProfileId: string | null = null
): Promise<StartSessionResult> {
  const day = await prisma.workoutDay.findUnique({ where: { id: workoutDayId } });
  if (!day) {
    const { t } = await getT();
    return { error: t.fitness.workout.dayNotFoundError };
  }

  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  const existing = await prisma.workoutSession.findFirst({
    where: { userId, managedProfileId, workoutDayId, startedAt: { gte: dayStart, lt: dayEnd } },
  });
  if (existing) {
    if (!existing.completedAt) {
      await prisma.workoutSession.update({
        where: { id: existing.id },
        data: { completedAt: existing.startedAt, durationSec: 0 },
      });
    }
    return { success: true, sessionId: existing.id };
  }

  const session = await prisma.workoutSession.create({
    data: { userId, managedProfileId, workoutDayId, startedAt: dayStart, completedAt: dayStart, durationSec: 0 },
  });
  return { success: true, sessionId: session.id };
}

/** Reverts a manual "mark done" — only for sessions with no logged sets, so
 * a real logged workout can never be silently wiped by this. */
export async function unmarkWorkoutDone(userId: string, sessionId: string): Promise<ServiceResult> {
  const session = await prisma.workoutSession.findUnique({ where: { id: sessionId }, include: { sets: true } });
  if (!session || session.userId !== userId) {
    const { t } = await getT();
    return { error: t.fitness.common.notAuthorizedError };
  }
  if (session.sets.length > 0) {
    const { t } = await getT();
    return { error: t.fitness.workout.sessionHasSetsError };
  }

  await prisma.workoutSession.delete({ where: { id: sessionId } });
  return { success: true };
}
