import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { requireUserId } from "@/lib/auth/session";
import { Card } from "@/components/ui/card";
import { FitnessNav } from "@/components/fitness/fitness-nav";
import { getActiveProgram, getWeekRange } from "@/lib/fitness/today";
import { deriveDayType } from "@/lib/fitness/day-type";
import { getT } from "@/lib/i18n";
import { DayMarker } from "./DayMarker";

export default async function CalendarPage({ searchParams }: { searchParams: Promise<{ offset?: string }> }) {
  const [userId, { t }] = await Promise.all([requireUserId(), getT()]);
  const params = await searchParams;

  const DAY_LABELS = [
    t.weekdaysFull.sun,
    t.weekdaysFull.mon,
    t.weekdaysFull.tue,
    t.weekdaysFull.wed,
    t.weekdaysFull.thu,
    t.weekdaysFull.fri,
    t.weekdaysFull.sat,
  ];

  const STATUS_META: Record<string, { icon: string; label: string }> = {
    rest: { icon: "💤", label: t.fitness.calendar.statusRest },
    completed: { icon: "✅", label: t.fitness.calendar.statusCompleted },
    // Nothing is ever inferred as "skipped" just from the date passing — the
    // user marks it themselves. This is the neutral, no-verdict state.
    unmarked: { icon: "—", label: t.fitness.calendar.statusUnmarked },
    pending: { icon: "🏋️", label: t.fitness.calendar.statusPending },
  };
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
                      ? `${t.fitness.programs.dayPrefix} ${day.scheduledDay.order + 1} · ${t.fitness.dayTypes[deriveDayType(day.scheduledDay.exercises.map((we) => we.exercise))]}`
                      : t.fitness.calendar.statusRest}
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
                      t={t}
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
