import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { addMonths, endOfMonth, endOfWeek, format, isSameMonth, isToday, startOfMonth, startOfWeek, subMonths } from "date-fns";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/cn";
import { prisma } from "@/lib/db/prisma";
import { requireUserId } from "@/lib/auth/session";
import { formatCurrency } from "@/lib/money/format";
import { calculatePendingFixedExpenses } from "@/lib/money/calculatePendingFixedExpenses";
import { generateOccurrences } from "@/lib/money/generateOccurrences";
import { getMonthlyHistory, type Compliance } from "@/lib/nutrition/history/getMonthlyHistory";
import { getActiveProgram } from "@/lib/fitness/today";
import { getT } from "@/lib/i18n";
import { dateFnsLocales } from "@/lib/i18n/date-fns-locale";

const COMPLIANCE_EMOJI: Record<Compliance, string> = { green: "🟢", yellow: "🟡", red: "🔴", none: "" };
// "unmarked" (a past scheduled day with no session) intentionally renders
// nothing here — this overview is read-only, and asserting "skipped" without
// the user having said so isn't this page's call to make. Marking happens
// on /fitness/calendar.
type FitnessDayStatus = "completed" | "unmarked" | "pending" | "rest";
const FITNESS_EMOJI: Record<FitnessDayStatus, string> = { completed: "✅", unmarked: "", pending: "🏋️", rest: "" };

export default async function UnifiedCalendarPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const { month: monthParam } = await searchParams;
  const [userId, { locale, t }] = await Promise.all([requireUserId(), getT()]);

  const anchor = monthParam ? new Date(`${monthParam}-01T00:00:00`) : new Date();
  const monthStart = startOfMonth(anchor);
  const monthEnd = endOfMonth(anchor);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  // ---- Money: net signed amount per day ----
  const [transactions, transfers, fixedExpenses, fixedExpenseTransactions, incomes] = await Promise.all([
    prisma.transaction.findMany({ where: { userId, date: { gte: gridStart, lte: gridEnd } }, select: { type: true, amount: true, date: true } }),
    prisma.transfer.findMany({ where: { userId, date: { gte: gridStart, lte: gridEnd } }, select: { date: true } }),
    prisma.fixedExpense.findMany({ where: { userId, isActive: true } }),
    prisma.transaction.findMany({ where: { userId, fixedExpenseId: { not: null } }, select: { fixedExpenseId: true, date: true } }),
    prisma.income.findMany({ where: { userId, isActive: true } }),
  ]);

  const pendingFixed = calculatePendingFixedExpenses(
    fixedExpenses.map((e) => ({
      id: e.id,
      amount: e.amount.toString(),
      dueDay: e.dueDay,
      frequency: e.frequency,
      startDate: e.startDate,
      endDate: e.endDate,
      isActive: e.isActive,
    })),
    fixedExpenseTransactions,
    { start: gridStart, end: gridEnd }
  );

  const moneyByDay = new Map<string, number>();
  const addMoney = (date: Date, amount: number) => {
    const key = format(date, "yyyy-MM-dd");
    moneyByDay.set(key, (moneyByDay.get(key) ?? 0) + amount);
  };
  for (const tx of transactions) addMoney(tx.date, tx.type === "INCOME" ? tx.amount.toNumber() : -tx.amount.toNumber());
  for (const item of pendingFixed.items) addMoney(item.dueDate, -item.amount.toNumber());
  for (const income of incomes) {
    const occurrences = generateOccurrences({ referenceDay: income.dayOfMonth, frequency: income.frequency, startDate: income.createdAt }, gridStart, gridEnd);
    for (const occurrence of occurrences) addMoney(occurrence, income.amount ? income.amount.toNumber() : 0);
  }

  // ---- Nutrition: compliance per day (only within the calendar month, getMonthlyHistory is month-scoped) ----
  const nutritionDays = await getMonthlyHistory(userId, monthStart.getFullYear(), monthStart.getMonth());
  const nutritionByDay = new Map(nutritionDays.map((d) => [format(d.date, "yyyy-MM-dd"), d.compliance]));

  // ---- Fitness: status per day, derived the same way as /fitness/calendar ----
  const [program, fitnessSessions] = await Promise.all([
    getActiveProgram(userId),
    prisma.workoutSession.findMany({ where: { userId, startedAt: { gte: gridStart, lte: gridEnd } }, select: { startedAt: true, completedAt: true } }),
  ]);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const fitnessByDay = new Map<string, FitnessDayStatus>();
  for (let cursor = new Date(gridStart); cursor <= gridEnd; cursor.setDate(cursor.getDate() + 1)) {
    const dayStart = new Date(cursor);
    dayStart.setHours(0, 0, 0, 0);
    const scheduledDay = program?.days.find((d) => d.dayOfWeek === dayStart.getDay());
    if (!scheduledDay) continue;
    const session = fitnessSessions.find((s) => {
      const sd = new Date(s.startedAt);
      sd.setHours(0, 0, 0, 0);
      return sd.getTime() === dayStart.getTime();
    });
    let status: FitnessDayStatus;
    if (session?.completedAt) status = "completed";
    else if (dayStart < today) status = "unmarked";
    else status = "pending";
    fitnessByDay.set(format(dayStart, "yyyy-MM-dd"), status);
  }

  const days: Date[] = [];
  for (let cursor = new Date(gridStart); cursor <= gridEnd; cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + 1)) {
    days.push(cursor);
  }

  const monthLabel = format(monthStart, "MMMM yyyy", { locale: dateFnsLocales[locale] });
  const prevMonth = format(subMonths(monthStart, 1), "yyyy-MM");
  const nextMonth = format(addMonths(monthStart, 1), "yyyy-MM");
  const weekdayLabels = [t.weekdaysShort.mon, t.weekdaysShort.tue, t.weekdaysShort.wed, t.weekdaysShort.thu, t.weekdaysShort.fri, t.weekdaysShort.sat, t.weekdaysShort.sun];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-bold capitalize">{monthLabel}</h1>
          <p className="text-sm text-ink-soft">{t.calendar.subtitle}</p>
        </div>
        <div className="flex items-center gap-1">
          <Link href={`/calendar?month=${prevMonth}`} className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-ink-soft hover:text-ink">
            <ChevronLeft size={16} />
          </Link>
          <Link href={`/calendar?month=${nextMonth}`} className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-ink-soft hover:text-ink">
            <ChevronRight size={16} />
          </Link>
        </div>
      </div>

      <Card className="overflow-x-auto p-2 md:p-4">
        <div className="grid min-w-[560px] grid-cols-7 gap-1 text-center text-xs font-medium text-ink-faint">
          {weekdayLabels.map((label, i) => (
            <div key={i} className="py-1">
              {label}
            </div>
          ))}
        </div>
        <div className="grid min-w-[560px] grid-cols-7 gap-1">
          {days.map((day) => {
            const key = format(day, "yyyy-MM-dd");
            const inMonth = isSameMonth(day, monthStart);
            const money = moneyByDay.get(key);
            const compliance = nutritionByDay.get(key);
            const fitnessStatus = fitnessByDay.get(key);
            return (
              <div key={key} className={cn("min-h-[76px] rounded-lg border border-border-soft p-1.5 text-left", !inMonth && "opacity-40")}>
                <p
                  className={cn(
                    "flex h-5 w-5 items-center justify-center rounded-full text-xs text-ink-faint",
                    isToday(day) && "bg-accent font-semibold text-white"
                  )}
                >
                  {format(day, "d")}
                </p>
                <div className="mt-1 flex flex-col gap-0.5 text-[11px] leading-tight">
                  {money != null && money !== 0 && (
                    <span className={cn("truncate", money >= 0 ? "text-money" : "text-fitness")}>
                      {money >= 0 ? "+" : ""}
                      {formatCurrency(money)}
                    </span>
                  )}
                  {compliance && compliance !== "none" && (
                    <span className="truncate text-nutrition">
                      {COMPLIANCE_EMOJI[compliance]} {t.nav.nutrition}
                    </span>
                  )}
                  {fitnessStatus && fitnessStatus !== "rest" && fitnessStatus !== "unmarked" && (
                    <span className="truncate text-fitness">
                      {FITNESS_EMOJI[fitnessStatus]} {t.nav.fitness}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <div className="mt-4 flex flex-wrap gap-4 text-xs text-ink-faint">
        <span>💰 {t.calendar.legendMoney}</span>
        <span>🟢🟡🔴 {t.calendar.legendNutrition}</span>
        <span>✅🏋️ {t.calendar.legendFitness}</span>
      </div>
    </div>
  );
}
