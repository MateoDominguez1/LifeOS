import { prisma } from "@/lib/db/prisma";
import { requireUserId } from "@/lib/auth/session";
import { Card } from "@/components/ui/card";
import { FitnessNav } from "@/components/fitness/fitness-nav";
import { getActiveProgram } from "@/lib/fitness/today";
import { deriveDayType, DAY_TYPE_LABELS_ES } from "@/lib/fitness/day-type";
import { ExerciseRow } from "./ExerciseRow";
import { AddExerciseForm } from "./AddExerciseForm";
import { AddDayForm } from "./AddDayForm";
import { RemoveDayButton } from "./RemoveDayButton";

const WEEKDAY_LABELS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

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
            {program.days.map((day, dayIndex) => {
              const addableExercises = allExercises.filter((e) => !day.exercises.some((de) => de.exerciseId === e.id));
              const dayType = deriveDayType(day.exercises.map((we) => we.exercise));
              return (
                <Card key={day.id}>
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="font-display text-sm font-semibold text-ink">
                      Día {dayIndex + 1} · {DAY_TYPE_LABELS_ES[dayType]}
                      <span className="ml-2 font-normal text-ink-faint">({WEEKDAY_LABELS[day.dayOfWeek]})</span>
                    </h2>
                    <RemoveDayButton workoutDayId={day.id} disabled={program.days.length <= 1} />
                  </div>
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

            <AddDayForm programId={program.id} usedWeekdays={program.days.map((d) => d.dayOfWeek)} weekdayLabels={WEEKDAY_LABELS} />
          </div>
        </>
      )}
    </div>
  );
}
