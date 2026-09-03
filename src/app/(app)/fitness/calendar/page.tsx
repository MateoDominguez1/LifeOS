import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { requireUserId } from "@/lib/auth/session";
import { Card } from "@/components/ui/card";
import { FitnessNav } from "@/components/fitness/fitness-nav";
import { getActiveProgram, getWeekRange } from "@/lib/fitness/today";
import { deriveDayType, DAY_TYPE_LABELS_ES } from "@/lib/fitness/day-type";
import { DayMarker } from "./DayMarker";

const DAY_LABELS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

const STATUS_META: Record<string, { icon: string; label: string }> = {
  rest: { icon: "💤", label: "Descanso" },
  completed: { icon: "✅", label: "Completado" },
  // Nothing is ever inferred as "skipped" just from the date passing — the
  // user marks it themselves. This is the neutral, no-verdict state.
  unmarked: { icon: "—", label: "Sin marcar" },
  pending: { icon: "🏋️", label: "Programado" },
};

export default async function CalendarPage({ searchParams }: { searchParams: Promise<{ offset?: string }> }) {
  const userId = await requireUserId();
  const params = await searchParams;
  const offset = params.offset ? Number(params.offset) : 0;

  const reference = new Date();
  reference.setDate(reference.getDate() + offset * 7);
  const { start, end } = getWeekRange(reference);

  const [program, sessions] = await Promise.all([
    getActiveProgram(userId),
    prisma.workoutSession.findMany({ where: { userId, startedAt: { gte: start, lt: end } }, include: { sets: true } }),
  ]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(start);
    date.setDate(date.getDate() + i);
    const scheduledDay = program?.days.find((d) => d.dayOfWeek === i);
    const session = sessions.find((s) => {
      const sd = new Date(s.startedAt);
      sd.setHours(0, 0, 0, 0);
      return sd.getTime() === date.getTime();
    });

    let status: keyof typeof STATUS_META;
    if (!scheduledDay) status = "rest";
    else if (session?.completedAt) status = "completed";
    else if (date < today) status = "unmarked";
    else status = "pending";

    return {
      date,
      label: DAY_LABELS[i],
      scheduledDay,
      status,
      isToday: date.getTime() === today.getTime(),
      isFuture: date.getTime() > today.getTime(),
      sessionId: session?.id ?? null,
      hasLoggedSets: (session?.sets.length ?? 0) > 0,
    };
  });

  return (
    <div>
      <FitnessNav />

      <div className="mb-4 flex items-center justify-between">
        <Link href={`/fitness/calendar?offset=${offset - 1}`} className="rounded-lg border border-border px-3 py-1.5 text-sm text-ink">
          ←
        </Link>
        <span className="font-display text-sm font-medium text-ink">
          {start.toISOString().slice(0, 10)} – {new Date(end.getTime() - 1).toISOString().slice(0, 10)}
        </span>
        <Link href={`/fitness/calendar?offset=${offset + 1}`} className="rounded-lg border border-border px-3 py-1.5 text-sm text-ink">
          →
        </Link>
      </div>

      <div className="flex flex-col gap-2">
        {days.map((day) => {
          const meta = STATUS_META[day.status];
          return (
            <Card key={day.label} className={day.isToday ? "bg-fitness-soft" : ""}>
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-ink">{day.label}</div>
                  <div className="text-xs text-ink-faint">
                    {day.scheduledDay
                      ? `Día ${day.scheduledDay.order + 1} · ${DAY_TYPE_LABELS_ES[deriveDayType(day.scheduledDay.exercises.map((we) => we.exercise))]}`
                      : "Descanso"}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-sm text-ink-soft">
                    {meta.icon} {meta.label}
                  </span>
                  {day.scheduledDay && !day.isFuture && (
                    <DayMarker
                      workoutDayId={day.scheduledDay.id}
                      date={day.date.toISOString()}
                      sessionId={day.sessionId}
                      isCompleted={day.status === "completed"}
                      canUndo={day.status === "completed" && !day.hasLoggedSets}
                    />
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
