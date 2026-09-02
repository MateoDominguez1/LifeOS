import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { requireUserId } from "@/lib/auth/session";
import { aiProvider } from "@/lib/fitness/ai/rules-provider";
import type { WeightSuggestion } from "@/lib/fitness/types";
import { WorkoutSessionClient, type ExerciseCardData } from "./session-client";

export default async function WorkoutSessionPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const userId = await requireUserId();
  const { sessionId } = await params;

  const session = await prisma.workoutSession.findUnique({
    where: { id: sessionId },
    include: {
      workoutDay: {
        include: {
          exercises: {
            where: { removedAt: null },
            orderBy: { order: "asc" },
            include: { exercise: true },
          },
        },
      },
      sets: true,
    },
  });
  if (!session || session.userId !== userId) notFound();
  if (session.completedAt) redirect(`/fitness/workout/${sessionId}/summary`);

  const profile = await prisma.fitnessProfile.findUnique({ where: { userId } });
  const rirRpeMode = profile?.rirRpeMode ?? "RIR";

  const exerciseCards: ExerciseCardData[] = [];

  for (const we of session.workoutDay?.exercises ?? []) {
    const lastSession = await prisma.workoutSession.findFirst({
      where: {
        userId,
        completedAt: { not: null },
        id: { not: sessionId },
        sets: { some: { workoutExercise: { exerciseId: we.exerciseId }, completed: true } },
      },
      orderBy: { startedAt: "desc" },
      include: { sets: { where: { workoutExercise: { exerciseId: we.exerciseId }, completed: true } } },
    });
    const history = lastSession?.sets ?? [];

    let suggestion: WeightSuggestion = aiProvider.suggestWeight(we.targetRepsMin, we.targetRepsMax, we.targetRir, history);

    const acceptedDeload = await prisma.aIRecommendation.findFirst({
      where: {
        userId,
        type: "PLATEAU_DETECTED",
        status: "ACCEPTED",
        payload: { path: ["exerciseId"], equals: we.exerciseId },
      },
    });
    if (acceptedDeload && history.length > 0) {
      const lastWeight = Math.max(...history.map((s) => s.weightKg));
      const deloadWeight = Math.round((lastWeight * 0.9) / 2.5) * 2.5;
      suggestion = {
        action: "decrease",
        suggestedWeightKg: deloadWeight,
        reason: `Deload acordado tras una meseta — probá ${deloadWeight}kg y reconstruí tus repeticiones desde ahí.`,
      };
    }

    const existingSets = session.sets
      .filter((s) => s.workoutExerciseId === we.id)
      .map((s) => ({ setNumber: s.setNumber, weightKg: s.weightKg, reps: s.reps, rir: s.rir, rpe: s.rpe, completed: s.completed }));

    exerciseCards.push({
      workoutExerciseId: we.id,
      exerciseName: we.exercise.name,
      targetSets: we.targetSets,
      targetRepsMin: we.targetRepsMin,
      targetRepsMax: we.targetRepsMax,
      targetRir: we.targetRir,
      targetRpe: we.targetRpe,
      restSeconds: we.restSeconds,
      suggestion,
      existingSets,
    });
  }

  return (
    <WorkoutSessionClient
      sessionId={sessionId}
      dayLabel={session.workoutDay?.label ?? "Entrenamiento"}
      rirRpeMode={rirRpeMode}
      exercises={exerciseCards}
    />
  );
}
