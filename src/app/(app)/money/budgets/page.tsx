import Link from "next/link";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { requireUserId } from "@/lib/auth/session";
import { MoneyNav } from "@/components/money/money-nav";
import { Card, CardLabel } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { formatCurrency } from "@/lib/money/format";
import { calculateBudgetProgress } from "@/lib/money/calculateBudgetProgress";
import { calculateCurrentBudgetPeriod } from "@/lib/money/calculateCurrentBudgetPeriod";
import { getPrimaryIncomeAndPeriod } from "@/lib/money/period";
import { getT } from "@/lib/i18n";
import { deleteBudgetAction, toggleBudgetActiveAction } from "./actions";

export default async function BudgetsPage() {
  const userId = await requireUserId();
  const { t } = await getT();
  const today = new Date();

  const [budgets, { period }] = await Promise.all([
    prisma.budget.findMany({ where: { userId }, include: { category: true }, orderBy: { createdAt: "asc" } }),
    getPrimaryIncomeAndPeriod(userId, today),
  ]);

  const expenses = await prisma.transaction.findMany({
    where: { userId, type: "EXPENSE", categoryId: { not: null }, date: { gte: period.start, lte: period.end } },
    select: { categoryId: true, accountId: true, amount: true, date: true },
  });
  const expenseInputs = expenses.map((e) => ({
    categoryId: e.categoryId,
    accountId: e.accountId,
    amount: e.amount.toString(),
    date: e.date,
  }));

  return (
    <div>
      <MoneyNav />
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h1 className="font-display text-xl font-bold">{t.money.budgets.title}</h1>
        <Link
          href="/money/budgets/new"
          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-accent px-3 font-display text-sm font-medium text-white hover:opacity-90"
        >
          <Plus size={15} /> {t.money.budgets.newBudget}
        </Link>
      </div>

      {budgets.length === 0 ? (
        <Card className="py-10 text-center text-sm text-ink-soft">{t.money.budgets.empty}</Card>
      ) : (
        <div className="flex flex-col gap-3">
          {budgets.map((budget) => {
            const progress = calculateBudgetProgress(
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
            );
            const pct = Math.min(
              progress.monthly.spent.dividedBy(budget.monthlyAmount).times(100).toNumber(),
              100
            );

            return (
              <Card key={budget.id} domain={budget.isActive ? "money" : "neutral"}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-ink">
                      <span aria-hidden>{budget.category.icon}</span>
                      {budget.name}
                    </div>
                    <CardLabel className="mt-1">
                      {formatCurrency(progress.monthly.spent.toNumber())} {t.money.common.of}{" "}
                      {formatCurrency(budget.monthlyAmount.toNumber())}
                    </CardLabel>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <Link
                      href={`/money/budgets/${budget.id}/edit`}
                      className="rounded-lg px-2 py-1 text-xs font-medium text-ink-faint hover:bg-surface-raised hover:text-ink"
                    >
                      {t.common.edit}
                    </Link>
                    <form action={toggleBudgetActiveAction.bind(null, budget.id)}>
                      <button
                        type="submit"
                        className="rounded-lg px-2 py-1 text-xs font-medium text-ink-faint hover:bg-surface-raised hover:text-ink"
                      >
                        {budget.isActive ? t.money.common.deactivate : t.money.common.activate}
                      </button>
                    </form>
                    <form action={deleteBudgetAction.bind(null, budget.id)}>
                      <button
                        type="submit"
                        className="rounded-lg px-2 py-1 text-xs font-medium text-ink-faint hover:bg-danger-soft hover:text-danger"
                      >
                        {t.common.delete}
                      </button>
                    </form>
                  </div>
                </div>
                <ProgressBar className="mt-3" value={pct} tone={pct >= 100 ? "danger" : pct >= 80 ? "warn" : "money"} />
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
