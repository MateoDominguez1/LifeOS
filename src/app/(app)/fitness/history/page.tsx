import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { requireUserId } from "@/lib/auth/session";
import { Card } from "@/components/ui/card";
import { FitnessNav } from "@/components/fitness/fitness-nav";
import { getT } from "@/lib/i18n";

export default async function HistoryPage() {
  const [userId, { t }] = await Promise.all([requireUserId(), getT()]);

  const sessions = await prisma.workoutSession.findMany({
    where: { userId, completedAt: { not: null } },
    orderBy: { completedAt: "desc" },
    include: { workoutDay: true, sets: { where: { completed: true }, include: { workoutExercise: true } } },
  });

  return (
    <div>
      <FitnessNav />

      {sessions.length === 0 ? (
        <Card className="text-center text-sm text-ink-soft">{t.fitness.history.empty}</Card>
      ) : (
        <div className="flex flex-col gap-2">
          {sessions.map((s) => {
            const exerciseCount = new Set(s.sets.map((set) => set.workoutExercise.exerciseId)).size;
            const volume = s.sets.reduce((sum, set) => sum + set.weightKg * set.reps, 0);
            return (
              <Link key={s.id} href={`/fitness/history/${s.id}`}>
                <Card className="flex items-center justify-between transition-colors hover:bg-surface-raised">
                  <div>
                    <div className="text-sm font-medium text-ink">{s.workoutDay?.label ?? t.fitness.common.workoutFallback}</div>
                    <div className="text-xs text-ink-faint">
                      {s.completedAt?.toISOString().slice(0, 10)} · {s.durationSec ? `${Math.round(s.durationSec / 60)} min` : "—"}
                    </div>
                  </div>
                  <div className="text-right text-xs text-ink-soft">
                    <div>{exerciseCount} {t.fitness.history.exercisesSuffix}</div>
                    <div>{Math.round(volume)} kg</div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
