import { prisma } from "@/lib/db/prisma";
import { requireUserId } from "@/lib/auth/session";
import { MoneyNav } from "@/components/money/money-nav";
import { Card, CardLabel } from "@/components/ui/card";
import { formatCurrency } from "@/lib/money/format";
import { calculateBudgetProgress } from "@/lib/money/calculateBudgetProgress";
import { getPrimaryIncomeAndPeriod } from "@/lib/money/period";
import { getT } from "@/lib/i18n";
import { AddItemsForm } from "./add-items-form";
import { CompleteForm } from "./complete-form";
import { deleteShoppingListItemAction } from "./actions";

export default async function ShoppingListPage() {
  const userId = await requireUserId();
  const { t } = await getT();
  const today = new Date();

  const [list, accounts, categories, groceryBudget, { period }] = await Promise.all([
    prisma.shoppingList.findFirst({
      where: { userId, completedAt: null },
      orderBy: { createdAt: "desc" },
      include: { items: { orderBy: { createdAt: "asc" } } },
    }),
    prisma.account.findMany({
      where: { userId, isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.category.findMany({
      where: { OR: [{ userId }, { userId: null }] },
      orderBy: { name: "asc" },
      select: { id: true, name: true, icon: true },
    }),
    prisma.budget.findFirst({ where: { userId, type: "GROCERY", isActive: true } }),
    getPrimaryIncomeAndPeriod(userId, today),
  ]);

  const items = list?.items ?? [];
  const total = items.reduce((sum, item) => sum + item.estimatedPrice.toNumber(), 0);

  let comparison: { withinBudget: boolean; remaining: number } | null = null;
  if (groceryBudget) {
    const expenses = await prisma.transaction.findMany({
      where: { userId, type: "EXPENSE", categoryId: groceryBudget.categoryId },
      select: { categoryId: true, accountId: true, amount: true, date: true },
    });
    const expenseInputs = expenses.map((e) => ({
      categoryId: e.categoryId,
      accountId: e.accountId,
      amount: e.amount.toString(),
      date: e.date,
    }));
    const progress = calculateBudgetProgress(
      {
        id: groceryBudget.id,
        categoryId: groceryBudget.categoryId,
        accountId: groceryBudget.accountId,
        monthlyAmount: groceryBudget.monthlyAmount.toString(),
        weeklyAmount: groceryBudget.weeklyAmount?.toString() ?? null,
        weekStartDay: groceryBudget.weekStartDay,
        isActive: groceryBudget.isActive,
      },
      expenseInputs,
      period,
      today
    );
    const bucket = progress.weekly ?? progress.monthly;
    comparison = { withinBudget: total <= bucket.remaining.toNumber(), remaining: bucket.remaining.toNumber() };
  }

  return (
    <div>
      <MoneyNav />
      <div className="flex flex-col gap-4">
        <h1 className="font-display text-xl font-bold">{t.money.shoppingList.title}</h1>

        <Card>
          <AddItemsForm t={t} />
        </Card>

        {items.length === 0 ? (
          <Card className="py-10 text-center text-sm text-ink-soft">
            {t.money.shoppingList.empty}
          </Card>
        ) : (
          <>
            <Card>
              <div className="flex items-center justify-between">
                <CardLabel>
                  {items.length} {items.length === 1 ? t.money.shoppingList.productSingular : t.money.shoppingList.productPlural}
                </CardLabel>
                <span className="font-mono text-sm font-semibold tabular-nums text-ink">
                  {formatCurrency(total)}
                </span>
              </div>
              <div className="mt-2 flex flex-col divide-y divide-border-soft">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between py-2 text-sm">
                    <span className="text-ink">{item.description}</span>
                    <div className="flex items-center gap-3">
                      <span className="font-mono tabular-nums text-ink-soft">
                        {formatCurrency(item.estimatedPrice.toNumber())}
                      </span>
                      <form action={deleteShoppingListItemAction.bind(null, item.id)}>
                        <button
                          type="submit"
                          aria-label={t.money.shoppingList.removeItemAriaLabel}
                          className="text-ink-faint hover:text-danger"
                        >
                          ×
                        </button>
                      </form>
                    </div>
                  </div>
                ))}
              </div>
              {comparison ? (
                <p className={`mt-3 text-sm ${comparison.withinBudget ? "text-money" : "text-danger"}`}>
                  {comparison.withinBudget
                    ? t.money.shoppingList.withinBudget
                    : `${t.money.shoppingList.overBudgetPrefix} ${formatCurrency(total - comparison.remaining)} ${t.money.shoppingList.overBudgetSuffix}`}{" "}
                  {t.money.shoppingList.remainingGroceryPrefix} {formatCurrency(comparison.remaining)} {t.money.shoppingList.remainingGrocerySuffix}
                </p>
              ) : (
                <p className="mt-3 text-sm text-ink-soft">
                  {t.money.shoppingList.noGroceryBudget}
                </p>
              )}
            </Card>

            {list && (
              <Card>
                <CardLabel>{t.money.shoppingList.convertToExpense}</CardLabel>
                <div className="mt-4">
                  <CompleteForm
                    shoppingListId={list.id}
                    accounts={accounts}
                    categories={categories}
                    defaultAmount={total}
                    defaultAccountId={groceryBudget?.accountId ?? accounts[0]?.id ?? ""}
                    defaultCategoryId={groceryBudget?.categoryId ?? ""}
                    t={t}
                  />
                </div>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}
