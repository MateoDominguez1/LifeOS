import { prisma } from "@/lib/db/prisma";
import { requireUserId } from "@/lib/auth/session";
import { Card } from "@/components/ui/card";
import { FitnessNav } from "@/components/fitness/fitness-nav";
import type { PRType } from "@/generated/prisma/client";

const PR_META: Record<PRType, { label: string; unit: string }> = {
  MAX_WEIGHT: { label: "Peso máximo", unit: "kg" },
  MAX_REPS: { label: "Más repeticiones", unit: "reps" },
  MAX_VOLUME: { label: "Más volumen", unit: "kg" },
  ESTIMATED_1RM: { label: "1RM estimado", unit: "kg" },
};

export default async function RecordsPage() {
  const userId = await requireUserId();

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
        <Card className="text-center text-sm text-ink-soft">No hay récords todavía — completá un entrenamiento para empezar a marcar PRs.</Card>
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
