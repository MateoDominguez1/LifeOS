import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { requireUserId } from "@/lib/auth/session";
import { Card } from "@/components/ui/card";

const PR_LABELS: Record<string, string> = {
  MAX_WEIGHT: "Peso máximo",
  MAX_REPS: "Más repeticiones",
  MAX_VOLUME: "Más volumen",
  ESTIMATED_1RM: "1RM estimado",
};

export default async function WorkoutSummaryPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const userId = await requireUserId();
  const { sessionId } = await params;

  const session = await prisma.workoutSession.findUnique({
    where: { id: sessionId },
    include: { workoutDay: true, sets: { where: { completed: true } } },
  });
  if (!session || session.userId !== userId) notFound();

  const newPRs = await prisma.personalRecord.findMany({
    where: { sessionId },
    include: { exercise: true },
  });

  const volume = session.sets.reduce((sum, s) => sum + s.weightKg * s.reps, 0);

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <header>
        <h1 className="font-display text-xl font-bold text-ink">Entrenamiento completo 🎉</h1>
        <p className="text-sm text-ink-soft">{session.workoutDay?.label}</p>
      </header>

      <Card>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <div className="font-display text-lg font-semibold text-ink">{Math.round((session.durationSec ?? 0) / 60)}</div>
            <div className="text-xs text-ink-faint">min</div>
          </div>
          <div>
            <div className="font-display text-lg font-semibold text-ink">{session.sets.length}</div>
            <div className="text-xs text-ink-faint">sets</div>
          </div>
          <div>
            <div className="font-display text-lg font-semibold text-ink">{Math.round(volume)}</div>
            <div className="text-xs text-ink-faint">kg volumen</div>
          </div>
        </div>
      </Card>

      {newPRs.length > 0 && (
        <Card domain="fitness">
          <h2 className="font-display text-sm font-semibold text-ink">🏆 ¡Nuevos récords personales!</h2>
          <div className="mt-2 space-y-1">
            {newPRs.map((pr) => (
              <div key={pr.id} className="flex justify-between text-sm">
                <span className="text-ink">
                  {pr.exercise.name} — {PR_LABELS[pr.type]}
                </span>
                <span className="font-mono text-ink-soft">{Math.round(pr.value * 10) / 10}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Link
        href="/fitness"
        className="block rounded-xl bg-fitness px-4 py-3 text-center font-display text-sm font-medium text-white hover:opacity-90"
      >
        Volver al inicio
      </Link>
    </div>
  );
}
