"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { requireUserId } from "@/lib/auth/session";

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

async function assertOwnsWorkoutExercise(userId: string, workoutExerciseId: string) {
  const we = await prisma.workoutExercise.findUnique({
    where: { id: workoutExerciseId },
    include: { workoutDay: { include: { program: true } } },
  });
  if (!we || we.workoutDay.program.userId !== userId) throw new Error("Not authorized");
  return we;
}

async function assertOwnsDay(userId: string, workoutDayId: string) {
  const day = await prisma.workoutDay.findUnique({ where: { id: workoutDayId }, include: { program: true } });
  if (!day || day.program.userId !== userId) throw new Error("Not authorized");
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
