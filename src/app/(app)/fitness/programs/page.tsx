import { prisma } from "@/lib/db/prisma";
import { requireUserId } from "@/lib/auth/session";
import { Card } from "@/components/ui/card";
import { FitnessNav } from "@/components/fitness/fitness-nav";
import { getActiveProgram } from "@/lib/fitness/today";
import { deriveDayType } from "@/lib/fitness/day-type";
import { getT } from "@/lib/i18n";
import { ExerciseRow } from "./ExerciseRow";
import { AddExerciseForm } from "./AddExerciseForm";
import { AddDayForm } from "./AddDayForm";
import { RemoveDayButton } from "./RemoveDayButton";

export default async function ProgramsPage() {
  const [userId, { t }] = await Promise.all([requireUserId(), getT()]);

  const WEEKDAY_LABELS = [
    t.weekdaysFull.sun,
    t.weekdaysFull.mon,
    t.weekdaysFull.tue,
    t.weekdaysFull.wed,
    t.weekdaysFull.thu,
    t.weekdaysFull.fri,
    t.weekdaysFull.sat,
  ];

  const [program, allExercises] = await Promise.all([
    getActiveProgram(userId),
    prisma.exercise.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div>
      <FitnessNav />

      {!program ? (
        <Card className="text-center text-sm text-ink-soft">{t.fitness.programs.noActiveProgram}</Card>
      ) : (
        <>
          <h1 className="mb-1 font-display text-xl font-bold text-ink">{program.name}</h1>
          <p className="mb-4 text-sm text-ink-soft">{t.fitness.programs.adjustPlanHint}</p>

          <div className="flex flex-col gap-4">
            {program.days.map((day, dayIndex) => {
              const addableExercises = allExercises.filter((e) => !day.exercises.some((de) => de.exerciseId === e.id));
              const dayType = deriveDayType(day.exercises.map((we) => we.exercise));
              return (
                <Card key={day.id}>
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="font-display text-sm font-semibold text-ink">
                      {t.fitness.programs.dayPrefix} {dayIndex + 1} · {t.fitness.dayTypes[dayType]}
                      <span className="ml-2 font-normal text-ink-faint">({WEEKDAY_LABELS[day.dayOfWeek]})</span>
                    </h2>
                    <RemoveDayButton workoutDayId={day.id} disabled={program.days.length <= 1} t={t} />
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
                        t={t}
                      />
                    ))}
                  </div>
                  <AddExerciseForm workoutDayId={day.id} options={addableExercises} t={t} />
                </Card>
              );
            })}

            <AddDayForm programId={program.id} usedWeekdays={program.days.map((d) => d.dayOfWeek)} weekdayLabels={WEEKDAY_LABELS} t={t} />
          </div>
        </>
      )}
    </div>
  );
}
