import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { requireUserId } from "@/lib/auth/session";
import { Card } from "@/components/ui/card";
import { FitnessNav } from "@/components/fitness/fitness-nav";
import { getT } from "@/lib/i18n";

export default async function HistoryDetailPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const [userId, { t }] = await Promise.all([requireUserId(), getT()]);
  const { sessionId } = await params;

  const session = await prisma.workoutSession.findUnique({
    where: { id: sessionId },
    include: {
      workoutDay: true,
      sets: { where: { completed: true }, orderBy: { setNumber: "asc" }, include: { workoutExercise: { include: { exercise: true } } } },
    },
  });
  if (!session || session.userId !== userId) notFound();

  const volume = session.sets.reduce((sum, s) => sum + s.weightKg * s.reps, 0);

  const byExercise = new Map<string, typeof session.sets>();
  for (const set of session.sets) {
    const name = set.workoutExercise.exercise.name;
    const list = byExercise.get(name) ?? [];
    list.push(set);
    byExercise.set(name, list);
  }

  return (
    <div>
      <FitnessNav />

      <h1 className="font-display text-xl font-bold text-ink">{session.workoutDay?.label ?? t.fitness.common.workoutFallback}</h1>
      <p className="mb-4 text-sm text-ink-soft">
        {session.completedAt?.toISOString().slice(0, 10)} · {session.durationSec ? `${Math.round(session.durationSec / 60)} min` : "—"} ·{" "}
        {Math.round(volume)} kg
      </p>

      <div className="flex flex-col gap-3">
        {[...byExercise.entries()].map(([name, sets]) => (
          <Card key={name}>
            <h2 className="font-display text-sm font-semibold text-ink">{name}</h2>
            <div className="mt-2 space-y-1 text-sm text-ink-soft">
              {sets.map((set) => (
                <div key={set.id} className="flex justify-between">
                  <span>{t.fitness.workout.setLabel} {set.setNumber}</span>
                  <span>
                    {set.weightKg}kg × {set.reps}
                    {set.rir != null && ` @ RIR ${set.rir}`}
                    {set.rpe != null && ` @ RPE ${set.rpe}`}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
