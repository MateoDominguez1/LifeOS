"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { requireUserId } from "@/lib/auth/session";
import { getT } from "@/lib/i18n";

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

async function assertOwnsWorkoutExercise(userId: string, workoutExerciseId: string) {
  const we = await prisma.workoutExercise.findUnique({
    where: { id: workoutExerciseId },
    include: { workoutDay: { include: { program: true } } },
  });
  if (!we || we.workoutDay.program.userId !== userId) {
    const { t } = await getT();
    throw new Error(t.fitness.common.notAuthorizedError);
  }
  return we;
}

async function assertOwnsDay(userId: string, workoutDayId: string) {
  const day = await prisma.workoutDay.findUnique({ where: { id: workoutDayId }, include: { program: true } });
  if (!day || day.program.userId !== userId) {
    const { t } = await getT();
    throw new Error(t.fitness.common.notAuthorizedError);
  }
  return day;
}

export async function updateExerciseTargets(
  workoutExerciseId: string,
  input: { targetSets: number; targetRepsMin: number; targetRepsMax: number; restSeconds: number }
) {
  const userId = await requireUserId();
  await assertOwnsWorkoutExercise(userId, workoutExerciseId);

  await prisma.workoutExercise.update({
    where: { id: workoutExerciseId },
    data: {
      targetSets: clamp(input.targetSets, 1, 10),
      targetRepsMin: clamp(input.targetRepsMin, 1, 50),
      targetRepsMax: clamp(input.targetRepsMax, 1, 50),
      restSeconds: clamp(input.restSeconds, 0, 600),
    },
  });

  revalidatePath("/fitness/programs");
}

export async function removeExercise(workoutExerciseId: string) {
  const userId = await requireUserId();
  await assertOwnsWorkoutExercise(userId, workoutExerciseId);

  // Soft-delete only: a WorkoutExercise that already has logged sets can't be
  // hard-deleted without breaking that history.
  await prisma.workoutExercise.update({ where: { id: workoutExerciseId }, data: { removedAt: new Date() } });

  revalidatePath("/fitness/programs");
}

export async function addExercise(workoutDayId: string, exerciseId: string) {
  const userId = await requireUserId();
  await assertOwnsDay(userId, workoutDayId);

  const max = await prisma.workoutExercise.aggregate({ where: { workoutDayId }, _max: { order: true } });

  await prisma.workoutExercise.create({
    data: {
      workoutDayId,
      exerciseId,
      order: (max._max.order ?? -1) + 1,
      targetSets: 3,
      targetRepsMin: 8,
      targetRepsMax: 12,
      restSeconds: 90,
      targetRir: 2,
    },
  });

  revalidatePath("/fitness/programs");
}

async function assertOwnsProgram(userId: string, programId: string) {
  const program = await prisma.workoutProgram.findUnique({ where: { id: programId } });
  if (!program || program.userId !== userId) {
    const { t } = await getT();
    throw new Error(t.fitness.common.notAuthorizedError);
  }
  return program;
}

export async function addWorkoutDay(programId: string, dayOfWeek: number) {
  const userId = await requireUserId();
  await assertOwnsProgram(userId, programId);

  const existing = await prisma.workoutDay.findMany({ where: { programId } });
  if (existing.some((d) => d.dayOfWeek === dayOfWeek)) {
    const { t } = await getT();
    throw new Error(t.fitness.programs.dayAlreadyAssignedError);
  }

  const maxOrder = existing.reduce((max, d) => Math.max(max, d.order), -1);

  await prisma.workoutDay.create({
    data: { programId, dayOfWeek, order: maxOrder + 1, label: "" },
  });

  revalidatePath("/fitness/programs");
}

export async function removeWorkoutDay(workoutDayId: string) {
  const userId = await requireUserId();
  const day = await assertOwnsDay(userId, workoutDayId);

  const siblingCount = await prisma.workoutDay.count({ where: { programId: day.programId } });
  if (siblingCount <= 1) {
    const { t } = await getT();
    throw new Error(t.fitness.programs.onlyDayError);
  }

  const loggedSets = await prisma.workoutSet.count({ where: { workoutExercise: { workoutDayId } } });
  if (loggedSets > 0) {
    const { t } = await getT();
    throw new Error(t.fitness.programs.dayHasWorkoutsError);
  }

  await prisma.workoutDay.delete({ where: { id: workoutDayId } });

  const remaining = await prisma.workoutDay.findMany({
    where: { programId: day.programId },
    orderBy: { order: "asc" },
  });
  await prisma.$transaction(
    remaining.map((d, i) => prisma.workoutDay.update({ where: { id: d.id }, data: { order: i } }))
  );

  revalidatePath("/fitness/programs");
  revalidatePath("/fitness/calendar");
  revalidatePath("/fitness");
  revalidatePath("/calendar");
}

export async function moveExercise(workoutDayId: string, workoutExerciseId: string, direction: "up" | "down") {
  const userId = await requireUserId();
  await assertOwnsDay(userId, workoutDayId);

  const exercises = await prisma.workoutExercise.findMany({
    where: { workoutDayId, removedAt: null },
    orderBy: { order: "asc" },
  });
  const index = exercises.findIndex((e) => e.id === workoutExerciseId);
  if (index === -1) return;

  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (swapIndex < 0 || swapIndex >= exercises.length) return;

  const current = exercises[index];
  const swap = exercises[swapIndex];

  await prisma.$transaction([
    prisma.workoutExercise.update({ where: { id: current.id }, data: { order: swap.order } }),
    prisma.workoutExercise.update({ where: { id: swap.id }, data: { order: current.order } }),
  ]);

  revalidatePath("/fitness/programs");
}
