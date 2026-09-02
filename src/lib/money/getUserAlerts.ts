import { differenceInCalendarDays, startOfDay, subDays } from "date-fns";
import { calculateTotalBalance } from "./calculateTotalBalance";
import { calculateCurrentBudgetPeriod } from "./calculateCurrentBudgetPeriod";
import { calculatePendingFixedExpenses } from "./calculatePendingFixedExpenses";
import { calculateBudgetProgress } from "./calculateBudgetProgress";
import { calculateAvailableToSpend } from "./calculateAvailableToSpend";
import { calculateSpendingPace } from "./calculateSpendingPace";
import { calculateAlerts, type Alert } from "./calculateAlerts";
import { groupExpensesByCategory } from "./groupExpensesByCategory";
import { Decimal, toDecimal } from "./decimal";
import { getPrimaryIncomeAndPeriod } from "./period";
import { prisma } from "@/lib/db/prisma";

/**
 * Recalcula las alertas de un usuario a partir de su estado financiero
 * actual. Usado tanto por el dashboard como por el cron de notificaciones
 * push, para no duplicar la lógica de "qué avisar".
 */
export async function getUserAlerts(userId: string, today: Date): Promise<Alert[]> {
  const { primaryIncome, period } = await getPrimaryIncomeAndPeriod(userId, today);
  const paydayDay = primaryIncome?.dayOfMonth ?? 1;
  const previousPeriod = calculateCurrentBudgetPeriod(paydayDay, subDays(period.start, 1));

  const [accounts, fixedExpenses, fixedExpenseTransactions, budgets, categoryExpenses, personalExpenses, categories] =
    await Promise.all([
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
      prisma.transaction.findMany({
        where: { userId, type: "EXPENSE", fixedExpenseId: null, date: { gte: period.start, lte: period.end } },
        select: { categoryId: true, amount: true },
      }),
      prisma.category.findMany({ where: { OR: [{ userId }, { userId: null }] }, select: { id: true, name: true } }),
    ]);

  const totalBalance = calculateTotalBalance(
    accounts.map((account) => ({
      id: account.id,
      balance: account.balance.toString(),
      isActive: account.isActive,
      excludeFromTotal: account.excludeFromTotal,
    }))
  );
  const excludedAccountIds = new Set(accounts.filter((account) => account.excludeFromTotal).map((account) => account.id));

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
    period
  );

  const expenseInputs = categoryExpenses.map((expense) => ({
    categoryId: expense.categoryId,
    accountId: expense.accountId,
    amount: expense.amount.toString(),
    date: expense.date,
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

  const available = calculateAvailableToSpend(
    totalBalance,
    pendingFixed.total,
    budgetProgresses.filter(isBudgetFromOwnMoney).map((entry) => entry.progress.monthly.remaining)
  );

  const daysRemaining = Math.max(differenceInCalendarDays(period.end, startOfDay(today)) + 1, 1);
  const daysElapsed = Math.max(differenceInCalendarDays(startOfDay(today), period.start) + 1, 1);

  const budgetedCategoryIds = new Set(budgets.map((budget) => budget.categoryId));
  const personalSpent = personalExpenses
    .filter((expense) => !expense.categoryId || !budgetedCategoryIds.has(expense.categoryId))
    .reduce((sum, expense) => sum.plus(toDecimal(expense.amount.toString())), new Decimal(0));

  const pace = calculateSpendingPace(personalSpent, daysElapsed, available, daysRemaining);

  const expenseById = new Map(fixedExpenses.map((expense) => [expense.id, expense]));
  const upcomingPayments = pendingFixed.items.map((item) => ({
    name: expenseById.get(item.fixedExpenseId)?.name ?? "Gasto fijo",
    amount: item.amount.toNumber(),
    dueDate: item.dueDate,
  }));

  const categoryById = new Map(categories.map((category) => [category.id, category]));
  const currentCategoryExpenses = expenseInputs.filter((expense) => expense.date >= period.start && expense.date <= period.end);
  const previousCategoryExpenses = expenseInputs.filter(
    (expense) => expense.date >= previousPeriod.start && expense.date <= previousPeriod.end
  );
  const currentTotals = groupExpensesByCategory(currentCategoryExpenses);
  const previousTotals = groupExpensesByCategory(previousCategoryExpenses);
  const categoryComparisons = currentTotals.map((entry) => ({
    categoryId: entry.categoryId,
    name: categoryById.get(entry.categoryId)?.name ?? "Categoría",
    current: entry.total,
    previous: previousTotals.find((prev) => prev.categoryId === entry.categoryId)?.total ?? new Decimal(0),
  }));

  return calculateAlerts({
    today,
    upcomingPayments,
    categoryComparisons,
    pace: { onTrack: pace.onTrack, projectedOverage: pace.projectedOverage },
    availableToSpend: available,
  });
}
