import { prisma } from "@/lib/db/prisma";
import { requireUserId } from "@/lib/auth/session";
import { Card } from "@/components/ui/card";
import { FitnessNav } from "@/components/fitness/fitness-nav";
import type { PRType } from "@/generated/prisma/client";
import { getT } from "@/lib/i18n";

export default async function RecordsPage() {
  const [userId, { t }] = await Promise.all([requireUserId(), getT()]);

  const PR_META: Record<PRType, { label: string; unit: string }> = {
    MAX_WEIGHT: { label: t.fitness.records.prMaxWeight, unit: "kg" },
    MAX_REPS: { label: t.fitness.records.prMaxReps, unit: t.fitness.workout.repsUnit },
    MAX_VOLUME: { label: t.fitness.records.prMaxVolume, unit: "kg" },
    ESTIMATED_1RM: { label: t.fitness.records.prEstimated1RM, unit: "kg" },
  };

  const records = await prisma.personalRecord.findMany({
    where: { userId },
    include: { exercise: true },
    orderBy: { achievedAt: "desc" },
  });

  const bestByExercise = new Map<string, Map<PRType, (typeof records)[number]>>();
  for (const rec of records) {
    const byType = bestByExercise.get(rec.exercise.name) ?? new Map();
    if (!byType.has(rec.type)) byType.set(rec.type, rec);
    bestByExercise.set(rec.exercise.name, byType);
  }

  const exerciseNames = [...bestByExercise.keys()].sort();

  return (
    <div>
      <FitnessNav />

      {exerciseNames.length === 0 ? (
        <Card className="text-center text-sm text-ink-soft">{t.fitness.records.empty}</Card>
      ) : (
        <div className="flex flex-col gap-3">
          {exerciseNames.map((name) => {
            const byType = bestByExercise.get(name)!;
            return (
              <Card key={name}>
                <h2 className="font-display text-sm font-semibold text-ink">{name}</h2>
                <div className="mt-2 grid grid-cols-2 gap-3">
                  {[...byType.entries()].map(([type, rec]) => (
                    <div key={type}>
                      <div className="font-display text-lg font-semibold text-ink">
                        {Math.round(rec.value * 10) / 10} <span className="text-xs font-normal text-ink-faint">{PR_META[type].unit}</span>
                      </div>
                      <div className="text-xs text-ink-soft">{PR_META[type].label}</div>
                    </div>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
