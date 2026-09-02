import { prisma } from "@/lib/db/prisma";
import { requireUserId } from "@/lib/auth/session";
import { Card } from "@/components/ui/card";
import { FitnessNav } from "@/components/fitness/fitness-nav";
import { getActiveProgram } from "@/lib/fitness/today";
import { ExerciseRow } from "./ExerciseRow";
import { AddExerciseForm } from "./AddExerciseForm";

const DAY_LABELS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

export default async function ProgramsPage() {
  const userId = await requireUserId();

  const [program, allExercises] = await Promise.all([
    getActiveProgram(userId),
    prisma.exercise.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div>
      <FitnessNav />

      {!program ? (
        <Card className="text-center text-sm text-ink-soft">No tenés un programa activo — completá el onboarding para generar uno.</Card>
      ) : (
        <>
          <h1 className="mb-1 font-display text-xl font-bold text-ink">{program.name}</h1>
          <p className="mb-4 text-sm text-ink-soft">Ajustá tu plan — agregá, quitá o reordená ejercicios, y modificá sets/reps/descanso.</p>

          <div className="flex flex-col gap-4">
            {program.days.map((day) => {
              const addableExercises = allExercises.filter((e) => !day.exercises.some((de) => de.exerciseId === e.id));
              return (
                <Card key={day.id}>
                  <h2 className="font-display text-sm font-semibold text-ink">
                    {DAY_LABELS[day.dayOfWeek]} · {day.label}
                  </h2>
                  <div className="mt-3 space-y-2">
                    {day.exercises.map((we, i) => (
                      <ExerciseRow
                        key={we.id}
                        data={{
                          id: we.id,
                          workoutDayId: day.id,
                          name: we.exercise.name,
                          targetSets: we.targetSets,
                          targetRepsMin: we.targetRepsMin,
                          targetRepsMax: we.targetRepsMax,
                          restSeconds: we.restSeconds,
                          canMoveUp: i > 0,
                          canMoveDown: i < day.exercises.length - 1,
                        }}
                      />
                    ))}
                  </div>
                  <AddExerciseForm workoutDayId={day.id} options={addableExercises} />
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
