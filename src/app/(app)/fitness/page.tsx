import Link from "next/link";
import { redirect } from "next/navigation";
import { ListChecks, CalendarDays, History, Trophy } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { requireUserId } from "@/lib/auth/session";
import { Card, CardLabel } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { FitnessNav } from "@/components/fitness/fitness-nav";
import { getTodaysWorkoutDay, getWeekRange } from "@/lib/fitness/today";
import { computeWorkoutStreak } from "@/lib/fitness/progress/streak";
import { deriveDayType, DAY_TYPE_LABELS_ES } from "@/lib/fitness/day-type";
import { resolveRecommendation } from "./dashboard-actions";
import { startWorkoutSession } from "./workout/actions";
import { DayMarker } from "./calendar/DayMarker";

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Buen día";
  if (hour < 18) return "Buenas tardes";
  return "Buenas noches";
}

const QUICK_LINKS = [
  { href: "/fitness/programs", label: "Programa", icon: ListChecks },
  { href: "/fitness/calendar", label: "Calendario", icon: CalendarDays },
  { href: "/fitness/history", label: "Historial", icon: History },
  { href: "/fitness/records", label: "Récords", icon: Trophy },
];

export default async function FitnessPage() {
  const userId = await requireUserId();

  const profile = await prisma.fitnessProfile.findUnique({ where: { userId } });
  if (!profile) redirect("/fitness/onboarding");

  const { start, end } = getWeekRange();
  const weeklyGoal = profile.daysPerWeek ?? 3;

  const [todays, latestWeight, weightGoal, weekSessions, weeklyPRCount, streak, recommendations] = await Promise.all([
    getTodaysWorkoutDay(userId),
    prisma.weightEntry.findFirst({ where: { userId, managedProfileId: null }, orderBy: { loggedAt: "desc" } }),
    prisma.goal.findFirst({ where: { userId, domain: "BODY", metric: "BODY_WEIGHT", status: "ACTIVE" } }),
    prisma.workoutSession.findMany({
      where: { userId, startedAt: { gte: start, lt: end } },
      include: { sets: { where: { completed: true } } },
    }),
    prisma.personalRecord.count({ where: { userId, achievedAt: { gte: start, lt: end } } }),
    computeWorkoutStreak(userId, weeklyGoal),
    prisma.aIRecommendation.findMany({ where: { userId, status: "PENDING" } }),
  ]);

  const weeklyCompleted = weekSessions.filter((s) => s.completedAt).length;
  const volume = weekSessions.reduce((sum, s) => sum + s.sets.reduce((sSum, set) => sSum + set.weightKg * set.reps, 0), 0);
  const durationSec = weekSessions.reduce((sum, s) => sum + (s.durationSec ?? 0), 0);

  let todaySession: { id: string; completedAt: Date | null; sets: { id: string }[] } | null = null;
  if (todays?.day) {
    todaySession = await prisma.workoutSession.findFirst({
      where: { userId, workoutDayId: todays.day.id, startedAt: { gte: start, lt: end } },
      orderBy: { startedAt: "desc" },
      select: { id: true, completedAt: true, sets: { select: { id: true }, take: 1 } },
    });
  }

  return (
    <div>
      <FitnessNav />

      <header className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-xl font-bold text-ink">{greeting()} 👋</h1>
      </header>

      <div className="flex flex-col gap-4">
        <Card domain="fitness">
          <CardLabel>Entrenamiento de hoy</CardLabel>
          {todays?.day ? (
            <div className="mt-2">
              <div className="text-lg font-semibold text-ink">
                Día {todays.day.order + 1} · {DAY_TYPE_LABELS_ES[deriveDayType(todays.day.exercises.map((we) => we.exercise))]}
              </div>
              <p className="text-sm text-ink-soft">
                {todays.day.exercises.length} ejercicios · ~{profile.sessionDurationMin ?? 60} min
              </p>
              {todaySession?.completedAt ? (
                <Link
                  href={`/fitness/workout/${todaySession.id}/summary`}
                  className="mt-3 inline-flex items-center gap-2 rounded-xl bg-money-soft px-4 py-2.5 font-display text-sm font-medium text-money"
                >
                  Completado ✓ — ver resumen
                </Link>
              ) : (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <form action={startWorkoutSession.bind(null, todays.day.id)}>
                    <button type="submit" className="rounded-xl bg-fitness px-4 py-2.5 font-display text-sm font-medium text-white hover:opacity-90">
                      {todaySession ? "Continuar entrenamiento" : "Empezar entrenamiento"}
                    </button>
                  </form>
                  <DayMarker
                    workoutDayId={todays.day.id}
                    date={new Date().toISOString()}
                    sessionId={todaySession?.id ?? null}
                    isCompleted={false}
                    canUndo={false}
                  />
                </div>
              )}
            </div>
          ) : (
            <p className="mt-2 text-sm text-ink-soft">Día de descanso 💤</p>
          )}
        </Card>

        {recommendations.map((rec) => {
          const payload = rec.payload as { exerciseName?: string; message?: string };
          return (
            <Card key={rec.id} className="flex flex-col gap-2">
              <div className="text-sm font-medium text-ink">{payload.exerciseName || "Tu rutina"}</div>
              <p className="text-sm text-ink-soft">{payload.message}</p>
              <div className="flex gap-2">
                <form action={resolveRecommendation.bind(null, rec.id, "ACCEPTED")}>
                  <button type="submit" className="rounded-lg bg-fitness-soft px-3 py-1.5 text-xs font-medium text-fitness">
                    Aceptar
                  </button>
                </form>
                <form action={resolveRecommendation.bind(null, rec.id, "DISMISSED")}>
                  <button type="submit" className="rounded-lg px-3 py-1.5 text-xs font-medium text-ink-faint hover:bg-surface-raised">
                    Descartar
                  </button>
                </form>
              </div>
            </Card>
          );
        })}

        <Card>
          <div className="flex items-center justify-between">
            <CardLabel>Esta semana</CardLabel>
            <span className="text-sm text-ink-soft">
              {weeklyCompleted} / {weeklyGoal}
            </span>
          </div>
          <ProgressBar value={Math.min((weeklyCompleted / weeklyGoal) * 100, 100)} tone="fitness" className="mt-2" />
          <div className="mt-4 grid grid-cols-3 gap-3 text-center">
            <div>
              <div className="font-display text-lg font-semibold text-ink">{Math.round(volume)}</div>
              <div className="text-xs text-ink-faint">kg volumen</div>
            </div>
            <div>
              <div className="font-display text-lg font-semibold text-ink">{Math.round(durationSec / 60)}</div>
              <div className="text-xs text-ink-faint">min</div>
            </div>
            <div>
              <div className="font-display text-lg font-semibold text-ink">{weeklyPRCount}</div>
              <div className="text-xs text-ink-faint">PRs</div>
            </div>
          </div>
          {streak > 0 && <p className="mt-3 text-sm text-ink-soft">🔥 {streak} semanas seguidas entrenando</p>}
        </Card>

        <div className="grid grid-cols-2 gap-3">
          {QUICK_LINKS.map((link) => {
            const Icon = link.icon;
            return (
              <Link key={link.href} href={link.href}>
                <Card className="flex items-center gap-2.5 transition-colors hover:bg-surface-raised">
                  <Icon size={18} className="shrink-0 text-fitness" />
                  <span className="font-display text-sm font-medium text-ink">{link.label}</span>
                </Card>
              </Link>
            );
          })}
        </div>

        <Card>
          <CardLabel>Cuerpo</CardLabel>
          {latestWeight ? (
            <p className="mt-2 text-sm text-ink">
              {latestWeight.weightKg} kg
              {weightGoal && <span className="text-ink-faint"> · objetivo {Number(weightGoal.targetValue)} kg</span>}
            </p>
          ) : (
            <p className="mt-2 text-sm text-ink-soft">Todavía no registraste tu peso.</p>
          )}
        </Card>
      </div>
    </div>
  );
}
