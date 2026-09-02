import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { addMonths, endOfMonth, endOfWeek, format, isSameMonth, isToday, startOfMonth, startOfWeek, subMonths } from "date-fns";
import { es } from "date-fns/locale";
import { MoneyNav } from "@/components/money/money-nav";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/cn";
import { calculatePendingFixedExpenses } from "@/lib/money/calculatePendingFixedExpenses";
import { generateOccurrences } from "@/lib/money/generateOccurrences";
import { prisma } from "@/lib/db/prisma";
import { requireUserId } from "@/lib/auth/session";
import { formatCurrency } from "@/lib/money/format";

type DayEvent = {
  key: string;
  label: string;
  amount: number | null;
  tone: "success" | "danger" | "neutral" | "warning";
};

const TONE_CLASSES: Record<DayEvent["tone"], string> = {
  success: "text-money",
  danger: "text-fitness",
  neutral: "text-ink-faint",
  warning: "text-warn",
};

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { month: monthParam } = await searchParams;
  const userId = await requireUserId();

  const anchor = monthParam ? new Date(`${monthParam}-01T00:00:00`) : new Date();
  const monthStart = startOfMonth(anchor);
  const monthEnd = endOfMonth(anchor);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const [transactions, transfers, fixedExpenses, fixedExpenseTransactions, incomes] = await Promise.all([
    prisma.transaction.findMany({
      where: { userId, date: { gte: gridStart, lte: gridEnd } },
      select: { id: true, type: true, amount: true, description: true, date: true },
    }),
    prisma.transfer.findMany({
      where: { userId, date: { gte: gridStart, lte: gridEnd } },
      select: {
        id: true,
        amount: true,
        date: true,
        fromAccount: { select: { name: true } },
        toAccount: { select: { name: true } },
      },
    }),
    prisma.fixedExpense.findMany({ where: { userId, isActive: true } }),
    prisma.transaction.findMany({
      where: { userId, fixedExpenseId: { not: null } },
      select: { fixedExpenseId: true, date: true },
    }),
    prisma.income.findMany({ where: { userId, isActive: true } }),
  ]);

  const pendingFixed = calculatePendingFixedExpenses(
    fixedExpenses.map((expense) => ({
      id: expense.id,
      amount: expense.amount.toString(),
      dueDay: expense.dueDay,
      frequency: expense.frequency,
      startDate: expense.startDate,
      endDate: expense.endDate,
      isActive: expense.isActive,
    })),
    fixedExpenseTransactions,
    { start: gridStart, end: gridEnd }
  );
  const fixedExpenseById = new Map(fixedExpenses.map((expense) => [expense.id, expense]));

  const eventsByDay = new Map<string, DayEvent[]>();
  const pushEvent = (date: Date, event: DayEvent) => {
    const key = format(date, "yyyy-MM-dd");
    const list = eventsByDay.get(key) ?? [];
    list.push(event);
    eventsByDay.set(key, list);
  };

  for (const tx of transactions) {
    pushEvent(tx.date, {
      key: `tx-${tx.id}`,
      label: tx.description,
      amount: tx.type === "INCOME" ? tx.amount.toNumber() : -tx.amount.toNumber(),
      tone: tx.type === "INCOME" ? "success" : "danger",
    });
  }
  for (const transfer of transfers) {
    pushEvent(transfer.date, {
      key: `tr-${transfer.id}`,
      label: `${transfer.fromAccount.name} → ${transfer.toAccount.name}`,
      amount: transfer.amount.toNumber(),
      tone: "neutral",
    });
  }
  for (const item of pendingFixed.items) {
    const expense = fixedExpenseById.get(item.fixedExpenseId);
    pushEvent(item.dueDate, {
      key: `fx-${item.fixedExpenseId}-${item.dueDate.toISOString()}`,
      label: `${expense?.name ?? "Gasto fijo"} (previsto)`,
      amount: -item.amount.toNumber(),
      tone: "warning",
    });
  }
  for (const income of incomes) {
    const occurrences = generateOccurrences(
      { referenceDay: income.dayOfMonth, frequency: income.frequency, startDate: income.createdAt },
      gridStart,
      gridEnd
    );
    for (const occurrence of occurrences) {
      pushEvent(occurrence, {
        key: `inc-${income.id}-${occurrence.toISOString()}`,
        label: `${income.name} (previsto)`,
        amount: income.amount ? income.amount.toNumber() : null,
        tone: "success",
      });
    }
  }

  const days: Date[] = [];
  for (let cursor = gridStart; cursor <= gridEnd; cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + 1)) {
    days.push(cursor);
  }

  const monthLabel = format(monthStart, "MMMM yyyy", { locale: es });
  const prevMonth = format(subMonths(monthStart, 1), "yyyy-MM");
  const nextMonth = format(addMonths(monthStart, 1), "yyyy-MM");
  const weekdayLabels = ["L", "M", "X", "J", "V", "S", "D"];

  return (
    <div>
      <MoneyNav />
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-xl font-bold capitalize">{monthLabel}</h1>
          <div className="flex items-center gap-1">
            <Link
              href={`/money/calendar?month=${prevMonth}`}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-ink-soft hover:text-ink"
            >
              <ChevronLeft size={16} />
            </Link>
            <Link
              href={`/money/calendar?month=${nextMonth}`}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-ink-soft hover:text-ink"
            >
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
              const events = eventsByDay.get(key) ?? [];
              const inMonth = isSameMonth(day, monthStart);
              return (
                <div
                  key={key}
                  className={cn("min-h-[84px] rounded-lg border border-border-soft p-1.5 text-left", !inMonth && "opacity-40")}
                >
                  <p
                    className={cn(
                      "flex h-5 w-5 items-center justify-center rounded-full text-xs text-ink-faint",
                      isToday(day) && "bg-fitness font-semibold text-white"
                    )}
                  >
                    {format(day, "d")}
                  </p>
                  <div className="mt-1 flex flex-col gap-0.5">
                    {events.slice(0, 3).map((event) => (
                      <p key={event.key} className={cn("truncate text-[11px] leading-tight", TONE_CLASSES[event.tone])} title={event.label}>
                        {event.amount === null ? event.label : `${event.amount >= 0 ? "+" : ""}${formatCurrency(event.amount)}`}
                      </p>
                    ))}
                    {events.length > 3 && <p className="text-[10px] text-ink-faint">+{events.length - 3} más</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
