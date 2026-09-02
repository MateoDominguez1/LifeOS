import { differenceInCalendarDays, startOfDay } from "date-fns";
import { prisma } from "@/lib/db/prisma";
import { calculateTotalBalance } from "./calculateTotalBalance";
import { calculatePendingFixedExpenses } from "./calculatePendingFixedExpenses";
import { calculateBudgetProgress } from "./calculateBudgetProgress";
import { calculateAvailableToSpend } from "./calculateAvailableToSpend";
import { calculateDailySpendingLimit } from "./calculateDailySpendingLimit";
import { getPrimaryIncomeAndPeriod } from "./period";

export type MoneySnapshot =
  | { hasAccounts: false }
  | {
      hasAccounts: true;
      available: number;
      dailyLimit: number;
      daysRemaining: number;
    };

/** Versión compacta del pipeline de /money, para widgets como el Home. */
export async function getMoneySnapshot(userId: string): Promise<MoneySnapshot> {
  const today = new Date();
  const accountCount = await prisma.account.count({ where: { userId } });
  if (accountCount === 0) return { hasAccounts: false };

  const { period } = await getPrimaryIncomeAndPeriod(userId, today);

  const [accounts, fixedExpenses, fixedExpenseTransactions, budgets, categoryExpenses] = await Promise.all([
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
        date: { gte: period.start, lte: period.end },
      },
      select: { categoryId: true, accountId: true, amount: true, date: true },
    }),
  ]);

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

  const budgetsRemaining = budgets
    .filter((b) => !b.accountId || !excludedAccountIds.has(b.accountId))
    .map(
      (b) =>
        calculateBudgetProgress(
          {
            id: b.id,
            categoryId: b.categoryId,
            accountId: b.accountId,
            monthlyAmount: b.monthlyAmount.toString(),
            weeklyAmount: b.weeklyAmount?.toString() ?? null,
            weekStartDay: b.weekStartDay,
            isActive: b.isActive,
          },
          expenseInputs,
          period,
          today
        ).monthly.remaining
    );

  const available = calculateAvailableToSpend(totalBalance, pendingFixed.total, budgetsRemaining);
  const daysRemaining = Math.max(differenceInCalendarDays(period.end, startOfDay(today)) + 1, 1);
  const dailyLimit = calculateDailySpendingLimit(available, period, today);

  return {
    hasAccounts: true,
    available: available.toNumber(),
    dailyLimit: dailyLimit.toNumber(),
    daysRemaining,
  };
}
