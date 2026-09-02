import Link from "next/link";
import { differenceInCalendarDays, startOfDay, subDays } from "date-fns";
import { Wallet, TrendingUp, ArrowRight } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { requireUserId } from "@/lib/auth/session";
import { MoneyNav } from "@/components/money/money-nav";
import { Card, CardLabel } from "@/components/ui/card";
import { formatCurrency } from "@/lib/money/format";
import { Decimal, toDecimal } from "@/lib/money/decimal";
import { calculateTotalBalance } from "@/lib/money/calculateTotalBalance";
import { calculateCurrentBudgetPeriod } from "@/lib/money/calculateCurrentBudgetPeriod";
import { calculatePendingFixedExpenses } from "@/lib/money/calculatePendingFixedExpenses";
import { calculateBudgetProgress } from "@/lib/money/calculateBudgetProgress";
import { calculateAvailableToSpend } from "@/lib/money/calculateAvailableToSpend";
import { calculateDailySpendingLimit } from "@/lib/money/calculateDailySpendingLimit";
import { calculateSpendingPace } from "@/lib/money/calculateSpendingPace";
import { calculateAlerts, type Alert as MoneyAlert } from "@/lib/money/calculateAlerts";
import { calculateProjectedBalance } from "@/lib/money/calculateProjectedBalance";
import { calculateWeeklyAvailable } from "@/lib/money/calculateWeeklyAvailable";
import { groupExpensesByCategory } from "@/lib/money/groupExpensesByCategory";
import { getPrimaryIncomeAndPeriod } from "@/lib/money/period";
import { getUpcomingImportantDates } from "@/lib/money/getUpcomingImportantDates";
import { AssistantPanel } from "@/components/money/assistant-panel";

const PROJECTION_HORIZON_DAYS = 30;

const IMPORTANT_DATE_ICON: Record<string, string> = {
  BIRTHDAY: "🎂",
  ANNIVERSARY: "💍",
  OTHER: "📌",
};

export default async function MoneyDashboardPage() {
  const userId = await requireUserId();
  const today = new Date();

  const [accountCount, { primaryIncome, period }] = await Promise.all([
    prisma.account.count({ where: { userId } }),
    getPrimaryIncomeAndPeriod(userId, today),
  ]);

  if (accountCount === 0) {
    return (
      <div>
        <MoneyNav />
        <EmptyState />
      </div>
    );
  }

  const previousPeriod = calculateCurrentBudgetPeriod(primaryIncome?.dayOfMonth ?? 1, subDays(period.start, 1));

  const [
    accounts,
    fixedExpenses,
    fixedExpenseTransactions,
    budgets,
    categoryExpenses,
    personalExpenses,
    categories,
    incomes,
    importantDates,
  ] = await Promise.all([
    prisma.account.findMany({ where: { userId } }),
    prisma.fixedExpense.findMany({ where: { userId, isActive: true } }),
    prisma.transaction.findMany({
      where: { userId, fixedExpenseId: { not: null } },
      select: { fixedExpenseId: true, date: true },
    }),
    prisma.budget.findMany({ where: { userId, isActive: true } }),
    prisma.transaction.findMany({
      where: {
        userId,
        type: "EXPENSE",
        categoryId: { not: null },
        date: { gte: previousPeriod.start, lte: period.end },
      },
      select: { categoryId: true, accountId: true, amount: true, date: true },
    }),
    // No `take` limit here: this feeds the weekly/pace calculations below and
    // needs every expense in the cycle, not just a preview. The "Gastos
    // recientes" card slices its own display list from the full result.
    prisma.transaction.findMany({
      where: { userId, type: "EXPENSE", fixedExpenseId: null, date: { gte: period.start, lte: period.end } },
      select: { id: true, categoryId: true, description: true, amount: true, date: true },
      orderBy: { date: "desc" },
    }),
    prisma.category.findMany({ where: { OR: [{ userId }, { userId: null }] } }),
    prisma.income.findMany({ where: { userId, isActive: true } }),
    prisma.importantDate.findMany({ where: { userId, isActive: true } }),
  ]);

  const upcomingDates = getUpcomingImportantDates(importantDates, today, 30);

  const totalBalance = calculateTotalBalance(
    accounts.map((a) => ({
      id: a.id,
      balance: a.balance.toString(),
      isActive: a.isActive,
      excludeFromTotal: a.excludeFromTotal,
    }))
  );

  const excludedAccountIds = new Set(accounts.filter((a) => a.excludeFromTotal).map((a) => a.id));

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
    period
  );

  const expenseInputs = categoryExpenses.map((e) => ({
    categoryId: e.categoryId,
    accountId: e.accountId,
    amount: e.amount.toString(),
    date: e.date,
  }));

  const budgetProgresses = budgets.map((budget) => ({
    budget,
    progress: calculateBudgetProgress(
      {
        id: budget.id,
        categoryId: budget.categoryId,
        accountId: budget.accountId,
        monthlyAmount: budget.monthlyAmount.toString(),
        weeklyAmount: budget.weeklyAmount?.toString() ?? null,
        weekStartDay: budget.weekStartDay,
        isActive: budget.isActive,
      },
      expenseInputs,
      period,
      today
    ),
  }));

  const isBudgetFromOwnMoney = (entry: (typeof budgetProgresses)[number]) =>
    !entry.budget.accountId || !excludedAccountIds.has(entry.budget.accountId);

  const groceryBudget = budgetProgresses.find((e) => e.budget.type === "GROCERY");
  const otherBudgets = budgetProgresses.filter((e) => e.budget.type !== "GROCERY");
  const otherBudgetsRemaining = otherBudgets
    .filter(isBudgetFromOwnMoney)
    .reduce((sum, e) => sum.plus(Decimal.max(e.progress.monthly.remaining, 0)), new Decimal(0));

  const available = calculateAvailableToSpend(
    totalBalance,
    pendingFixed.total,
    budgetProgresses.filter(isBudgetFromOwnMoney).map((e) => e.progress.monthly.remaining)
  );

  const daysRemaining = Math.max(differenceInCalendarDays(period.end, startOfDay(today)) + 1, 1);
  const daysElapsed = Math.max(differenceInCalendarDays(startOfDay(today), period.start) + 1, 1);
  const dailyLimit = calculateDailySpendingLimit(available, period, today);

  const budgetedCategoryIds = new Set(budgets.map((b) => b.categoryId));
  const freeExpenses = personalExpenses.filter((e) => !e.categoryId || !budgetedCategoryIds.has(e.categoryId));
  const personalSpent = freeExpenses.reduce((sum, e) => sum.plus(toDecimal(e.amount.toString())), new Decimal(0));

  const pace = calculateSpendingPace(personalSpent, daysElapsed, available, daysRemaining);

  const WEEK_STARTS_ON = 1; // lunes
  const incomeTransactions = await prisma.transaction.findMany({
    where: { userId, type: "INCOME", date: { gte: period.start, lte: period.end } },
    select: { amount: true, date: true },
  });
  const incomeInCycle = incomeTransactions.reduce((sum, i) => sum.plus(toDecimal(i.amount.toString())), new Decimal(0));
  // Reconstruye el pozo "estable" del ciclo: se le devuelve el gasto libre ya
  // hecho y se le saca cualquier ingreso ya cobrado en el medio del ciclo,
  // para que esa plata no se reparta como si siempre hubiera estado ahí.
  const totalDiscretionaryForCycle = available.plus(personalSpent).minus(incomeInCycle);
  const weeklyMovements = [
    ...freeExpenses.map((e) => ({ amount: e.amount.toString(), date: e.date })),
    ...incomeTransactions.map((i) => ({ amount: i.amount.negated().toString(), date: i.date })),
  ];
  const weeklyAvailable = calculateWeeklyAvailable(
    totalDiscretionaryForCycle,
    weeklyMovements,
    period,
    today,
    WEEK_STARTS_ON
  );

  const categoryById = new Map(categories.map((c) => [c.id, c]));

  const currentCategoryExpenses = expenseInputs.filter((e) => e.date >= period.start && e.date <= period.end);
  const previousCategoryExpenses = expenseInputs.filter(
    (e) => e.date >= previousPeriod.start && e.date <= previousPeriod.end
  );
  const currentTotals = groupExpensesByCategory(currentCategoryExpenses);
  const previousTotals = groupExpensesByCategory(previousCategoryExpenses);
  const categoryComparisons = currentTotals.map((entry) => ({
    categoryId: entry.categoryId,
    name: categoryById.get(entry.categoryId)?.name ?? "Sin categoría",
    current: entry.total,
    previous: previousTotals.find((p) => p.categoryId === entry.categoryId)?.total ?? new Decimal(0),
  }));

  const expenseById = new Map(fixedExpenses.map((e) => [e.id, e]));
  const upcomingPayments = pendingFixed.items
    .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
    .slice(0, 5)
    .map((item) => {
      const expense = expenseById.get(item.fixedExpenseId);
      const category = expense?.categoryId ? categoryById.get(expense.categoryId) : undefined;
      return {
        id: `${item.fixedExpenseId}-${item.dueDate.toISOString()}`,
        name: expense?.name ?? "Gasto fijo",
        icon: category?.icon ?? "🔁",
        amount: item.amount.toNumber(),
        dueDate: item.dueDate,
      };
    });

  const alerts = calculateAlerts({
    today,
    upcomingPayments,
    categoryComparisons,
    pace: { onTrack: pace.onTrack, projectedOverage: pace.projectedOverage },
    availableToSpend: available,
  });

  const horizonDate = new Date(today);
  horizonDate.setDate(horizonDate.getDate() + PROJECTION_HORIZON_DAYS);
  const projectedBalance = calculateProjectedBalance(
    totalBalance,
    incomes.map((i) => ({
      amount: i.amount ? i.amount.toString() : null,
      dayOfMonth: i.dayOfMonth,
      frequency: i.frequency,
      createdAt: i.createdAt,
      isActive: i.isActive,
    })),
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
    today,
    horizonDate
  );

  const assistantSnapshot = {
    totalBalance: totalBalance.toNumber(),
    available: available.toNumber(),
    dailyLimit: dailyLimit.toNumber(),
    daysRemaining,
    weeklyRemaining: weeklyAvailable.remaining.toNumber(),
    weeklyBudget: weeklyAvailable.weeklyBudget.toNumber(),
    daysLeftInWeek: weeklyAvailable.daysLeftInWeek,
    reservedFixed: pendingFixed.total.toNumber(),
    groceryRemaining: groceryBudget ? groceryBudget.progress.monthly.remaining.toNumber() : null,
    otherBudgetsRemaining: otherBudgetsRemaining.toNumber(),
    upcomingPayments,
    alerts,
    onTrack: pace.onTrack,
    averageDailySpend: pace.averageDailySpend.toNumber(),
    projectedOverage: pace.projectedOverage.toNumber(),
  };

  return (
    <div>
      <MoneyNav />
      <div className="flex flex-col gap-4">
        <Card domain="money" className="flex flex-col gap-1">
          <CardLabel>Disponible para gastar</CardLabel>
          <div className="font-mono text-3xl font-semibold tabular-nums text-ink">
            {formatCurrency(available.toNumber())}
          </div>
          <p className="text-sm text-ink-soft">
            {formatCurrency(dailyLimit.toNumber())}/día · quedan {daysRemaining}{" "}
            {daysRemaining === 1 ? "día" : "días"} de este ciclo
          </p>
        </Card>

        {alerts.length > 0 && (
          <div className="flex flex-col gap-2">
            {alerts.map((alert) => (
              <AlertRow key={alert.id} alert={alert} />
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Stat label="Saldo total" value={formatCurrency(totalBalance.toNumber())} />
          <Stat label="Reservado (gastos fijos)" value={formatCurrency(pendingFixed.total.toNumber())} />
          <Stat
            label="Presupuestos restantes"
            value={formatCurrency(
              (groceryBudget ? Decimal.max(groceryBudget.progress.monthly.remaining, 0) : new Decimal(0))
                .plus(otherBudgetsRemaining)
                .toNumber()
            )}
          />
        </div>

        <Card>
          <div className="flex items-center justify-between">
            <CardLabel>Esta semana</CardLabel>
            <span className="text-xs text-ink-faint">reparto semanal del disponible</span>
          </div>
          <div className="mt-1 font-mono text-xl font-semibold tabular-nums text-ink">
            {formatCurrency(weeklyAvailable.remaining.toNumber())}
          </div>
          <p className="text-sm text-ink-soft">
            de {formatCurrency(weeklyAvailable.weeklyBudget.toNumber())} · quedan {weeklyAvailable.daysLeftInWeek}{" "}
            {weeklyAvailable.daysLeftInWeek === 1 ? "día" : "días"} de esta semana
          </p>
          {!weeklyAvailable.carryover.isZero() && (
            <p className="mt-1.5 text-xs text-ink-faint">
              Base de {formatCurrency(weeklyAvailable.baseWeeklyAmount.toNumber())}/semana{" "}
              {weeklyAvailable.carryover.isPositive() ? (
                <>+ {formatCurrency(weeklyAvailable.carryover.toNumber())} que sobró de semanas anteriores de este ciclo.</>
              ) : (
                <>− {formatCurrency(weeklyAvailable.carryover.abs().toNumber())} que te pasaste en semanas anteriores de este ciclo.</>
              )}
            </p>
          )}
        </Card>

        {upcomingPayments.length > 0 && (
          <Card>
            <CardLabel>Próximos pagos</CardLabel>
            <div className="mt-3 flex flex-col gap-1">
              {upcomingPayments.map((p) => {
                const daysUntil = differenceInCalendarDays(startOfDay(p.dueDate), startOfDay(today));
                return (
                  <div key={p.id} className="flex items-center justify-between gap-3 rounded-xl px-1.5 py-2 text-sm transition-colors hover:bg-surface-raised">
                    <div className="flex min-w-0 items-center gap-3">
                      <span
                        aria-hidden
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-fitness-soft text-base"
                      >
                        {p.icon}
                      </span>
                      <div className="min-w-0">
                        <div className="truncate text-ink">{p.name}</div>
                        <div className="text-xs text-ink-faint">
                          {p.dueDate.toLocaleDateString("es-AR", { day: "numeric", month: "short" })} ·{" "}
                          {daysUntil <= 0 ? "hoy" : daysUntil === 1 ? "mañana" : `en ${daysUntil} días`}
                        </div>
                      </div>
                    </div>
                    <span className="shrink-0 font-mono text-sm tabular-nums text-ink">{formatCurrency(p.amount)}</span>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {upcomingDates.length > 0 && (
          <Card>
            <CardLabel>Fechas importantes</CardLabel>
            <div className="mt-3 flex flex-col gap-1">
              {upcomingDates.slice(0, 4).map((d) => (
                <div key={d.id} className="flex items-center justify-between gap-3 rounded-xl px-1.5 py-2 text-sm transition-colors hover:bg-surface-raised">
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      aria-hidden
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-soft text-base"
                    >
                      {IMPORTANT_DATE_ICON[d.type]}
                    </span>
                    <div className="min-w-0 truncate text-ink">
                      {d.personName}
                      {d.relationship && <span className="text-ink-faint"> ({d.relationship})</span>}
                    </div>
                  </div>
                  <span className="shrink-0 text-ink-soft">
                    {d.daysUntil === 0 ? "hoy" : d.daysUntil === 1 ? "mañana" : `en ${d.daysUntil} días`}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        )}

        <Card>
          <div className="mb-1 flex items-center justify-between">
            <CardLabel>Gastos recientes</CardLabel>
            <Link href="/money/transactions" className="text-xs font-medium text-accent-ink hover:underline">
              Ver todos
            </Link>
          </div>
          {freeExpenses.length === 0 ? (
            <p className="mt-2 text-sm text-ink-soft">Todavía no registraste gastos este ciclo.</p>
          ) : (
            <div className="mt-2 flex flex-col divide-y divide-border-soft">
              {freeExpenses.slice(0, 6).map((expense) => {
                const category = expense.categoryId ? categoryById.get(expense.categoryId) : undefined;
                return (
                  <div key={expense.id} className="flex items-center justify-between py-2.5 text-sm">
                    <div className="flex items-center gap-2.5">
                      <span aria-hidden>{category?.icon ?? "📦"}</span>
                      <div>
                        <div className="text-ink">{expense.description}</div>
                        <div className="text-xs text-ink-faint">{category?.name ?? "Sin categoría"}</div>
                      </div>
                    </div>
                    <span className="font-mono tabular-nums text-ink">
                      {formatCurrency(expense.amount.toNumber())}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card domain="accent" className="flex items-center justify-between">
          <div>
            <CardLabel>Proyección a {PROJECTION_HORIZON_DAYS} días</CardLabel>
            <p className="mt-1 text-sm text-ink-soft">
              De {formatCurrency(totalBalance.toNumber())} a{" "}
              <span className="font-medium text-ink">{formatCurrency(projectedBalance.toNumber())}</span>
            </p>
          </div>
          <TrendingUp size={20} className="text-accent-ink" />
        </Card>

        <AssistantPanel snapshot={assistantSnapshot} />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardLabel>{label}</CardLabel>
      <div className="mt-1 font-mono text-lg font-semibold tabular-nums text-ink">{value}</div>
    </Card>
  );
}

function AlertRow({ alert }: { alert: MoneyAlert }) {
  const toneClasses = {
    success: "bg-money-soft text-money",
    warning: "bg-warn-soft text-warn",
    danger: "bg-danger-soft text-danger",
  } as const;

  return (
    <div className={`rounded-xl px-4 py-2.5 text-sm ${toneClasses[alert.tone]}`}>{alert.message}</div>
  );
}

function EmptyState() {
  return (
    <Card domain="money" className="flex flex-col items-center gap-3 py-10 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-money-soft text-money">
        <Wallet size={22} />
      </div>
      <h2 className="font-display text-lg font-bold">Agregá tu primera cuenta</h2>
      <p className="max-w-xs text-sm text-ink-soft">
        Para ver tu disponible para gastar necesitás al menos una cuenta con saldo.
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        <Link
          href="/money/onboarding"
          className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-accent px-4 font-display text-sm font-medium text-white hover:opacity-90"
        >
          Configuración guiada <ArrowRight size={16} />
        </Link>
        <Link
          href="/money/accounts/new"
          className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-border px-4 font-display text-sm font-medium text-ink-soft hover:border-accent/50 hover:text-ink"
        >
          Crear cuenta yo mismo
        </Link>
      </div>
    </Card>
  );
}
