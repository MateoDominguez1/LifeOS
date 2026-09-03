import { prisma } from "@/lib/db/prisma";
import { requireUserId } from "@/lib/auth/session";
import { MoneyNav } from "@/components/money/money-nav";
import { Card, CardLabel } from "@/components/ui/card";
import { CategoryBreakdownChart } from "@/components/money/charts/category-breakdown-chart";
import { MonthComparisonChart } from "@/components/money/charts/month-comparison-chart";
import { groupExpensesByCategory } from "@/lib/money/groupExpensesByCategory";
import { getRecentBudgetPeriods } from "@/lib/money/getRecentBudgetPeriods";
import { Decimal, toDecimal } from "@/lib/money/decimal";
import { getPrimaryIncomeAndPeriod } from "@/lib/money/period";
import { getT } from "@/lib/i18n";

const PERIODS_TO_COMPARE = 6;

export default async function StatsPage() {
  const userId = await requireUserId();
  const { t } = await getT();
  const today = new Date();
  const { primaryIncome } = await getPrimaryIncomeAndPeriod(userId, today);
  const paydayDay = primaryIncome?.dayOfMonth ?? 1;

  const periods = getRecentBudgetPeriods(paydayDay, today, PERIODS_TO_COMPARE);
  const windowStart = periods[periods.length - 1].start;
  const windowEnd = periods[0].end;

  const [categories, expenses] = await Promise.all([
    prisma.category.findMany({ where: { OR: [{ userId }, { userId: null }] } }),
    prisma.transaction.findMany({
      where: { userId, type: "EXPENSE", date: { gte: windowStart, lte: windowEnd } },
      select: { categoryId: true, amount: true, date: true },
    }),
  ]);

  const expenseInputs = expenses.map((expense) => ({
    categoryId: expense.categoryId,
    amount: expense.amount.toString(),
    date: expense.date,
  }));

  const categoryById = new Map(categories.map((category) => [category.id, category]));
  const currentPeriodExpenses = expenseInputs.filter((e) => e.date >= periods[0].start && e.date <= periods[0].end);
  const categoryTotals = groupExpensesByCategory(currentPeriodExpenses)
    .map((entry) => {
      const category = categoryById.get(entry.categoryId);
      return {
        categoryId: entry.categoryId,
        name: category?.name ?? t.money.common.noCategory,
        icon: category?.icon ?? "📦",
        color: category?.color ?? "#94a3b8",
        amount: entry.total.toNumber(),
      };
    })
    .sort((a, b) => b.amount - a.amount);

  const periodTotals = periods.map((period) =>
    expenseInputs
      .filter((e) => e.date >= period.start && e.date <= period.end)
      .reduce((sum, e) => sum.plus(toDecimal(e.amount)), new Decimal(0))
  );

  const thisPeriodTotal = periodTotals[0] ?? new Decimal(0);
  const lastPeriodTotal = periodTotals[1] ?? new Decimal(0);
  const historicalTotals = periodTotals.slice(1);
  const average =
    historicalTotals.length > 0
      ? historicalTotals.reduce((sum, total) => sum.plus(total), new Decimal(0)).dividedBy(historicalTotals.length)
      : thisPeriodTotal;

  const comparisonData = [
    { label: t.money.stats.thisCycle, amount: thisPeriodTotal.toNumber() },
    { label: t.money.stats.previous, amount: lastPeriodTotal.toNumber() },
    { label: t.money.stats.average, amount: average.toNumber() },
  ];

  return (
    <div>
      <MoneyNav />
      <div className="flex flex-col gap-4">
        <h1 className="font-display text-xl font-bold">{t.money.stats.title}</h1>

        <Card>
          <CardLabel>{t.money.stats.byCategoryTitle}</CardLabel>
          {categoryTotals.length === 0 ? (
            <p className="mt-4 text-sm text-ink-soft">{t.money.stats.noCategorizedExpenses}</p>
          ) : (
            <div className="mt-4">
              <CategoryBreakdownChart data={categoryTotals} />
            </div>
          )}
        </Card>

        <Card>
          <CardLabel>{t.money.stats.totalComparisonTitle}</CardLabel>
          <div className="mt-2">
            <MonthComparisonChart data={comparisonData} />
          </div>
        </Card>
      </div>
    </div>
  );
}
