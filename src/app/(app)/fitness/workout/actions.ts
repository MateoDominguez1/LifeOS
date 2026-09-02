"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUserId } from "@/lib/auth/session";
import * as workoutService from "@/lib/fitness/workout/service";
import type { LogSetInput } from "@/lib/fitness/workout/service";

export type { LogSetInput };

export async function startWorkoutSession(workoutDayId: string) {
  const userId = await requireUserId();
  const result = await workoutService.startWorkoutSession(userId, workoutDayId);
  if ("error" in result) throw new Error(result.error);
  redirect(`/fitness/workout/${result.sessionId}`);
}

export async function logSet(input: LogSetInput) {
  const userId = await requireUserId();
  const result = await workoutService.logSet(userId, input);
  if ("error" in result) throw new Error(result.error);
}

export async function finishWorkoutSession(sessionId: string) {
  const userId = await requireUserId();
  const result = await workoutService.finishWorkoutSession(userId, sessionId);
  if ("error" in result) throw new Error(result.error);
  redirect(`/fitness/workout/${sessionId}/summary`);
}

export async function markWorkoutDone(workoutDayId: string, date: string) {
  const userId = await requireUserId();
  const result = await workoutService.markWorkoutDone(userId, workoutDayId, new Date(date));
  if ("error" in result) throw new Error(result.error);
  revalidatePath("/fitness/calendar");
  revalidatePath("/calendar");
  revalidatePath("/fitness");
}

export async function unmarkWorkoutDone(sessionId: string) {
  const userId = await requireUserId();
  const result = await workoutService.unmarkWorkoutDone(userId, sessionId);
  if ("error" in result) throw new Error(result.error);
  revalidatePath("/fitness/calendar");
  revalidatePath("/calendar");
  revalidatePath("/fitness");
}
