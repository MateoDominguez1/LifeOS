import Link from "next/link";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { requireUserId } from "@/lib/auth/session";
import { MoneyNav } from "@/components/money/money-nav";
import { Card, CardLabel } from "@/components/ui/card";
import { formatCurrency } from "@/lib/money/format";
import { getPrimaryIncomeAndPeriod } from "@/lib/money/period";
import { calculatePendingFixedExpenses } from "@/lib/money/calculatePendingFixedExpenses";
import { deleteFixedExpenseAction, toggleFixedExpenseActiveAction, markFixedExpensePaidAction } from "./actions";

const FREQUENCY_LABEL: Record<string, string> = {
  WEEKLY: "Semanal",
  MONTHLY: "Mensual",
  YEARLY: "Anual",
};

export default async function FixedExpensesPage() {
  const userId = await requireUserId();
  const today = new Date();

  const [expenses, { period }] = await Promise.all([
    prisma.fixedExpense.findMany({
      where: { userId },
      include: { account: true, category: true },
      orderBy: { dueDay: "asc" },
    }),
    getPrimaryIncomeAndPeriod(userId, today),
  ]);

  const fixedExpenseTransactions = await prisma.transaction.findMany({
    where: { userId, fixedExpenseId: { not: null } },
    select: { fixedExpenseId: true, date: true },
  });

  const pending = calculatePendingFixedExpenses(
    expenses.map((e) => ({
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
  const pendingByExpense = new Map(pending.items.map((item) => [item.fixedExpenseId, item]));

  return (
    <div>
      <MoneyNav />
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h1 className="font-display text-xl font-bold">Gastos fijos</h1>
        <Link
          href="/money/fixed-expenses/new"
          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-accent px-3 font-display text-sm font-medium text-white hover:opacity-90"
        >
          <Plus size={15} /> Nuevo gasto fijo
        </Link>
      </div>

      {expenses.length === 0 ? (
        <Card className="py-10 text-center text-sm text-ink-soft">Todavía no agregaste gastos fijos.</Card>
      ) : (
        <div className="flex flex-col gap-3">
          {expenses.map((expense) => {
            const pendingItem = pendingByExpense.get(expense.id);
            return (
              <Card
                key={expense.id}
                domain={expense.isActive ? "fitness" : "neutral"}
                className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-ink">
                    {expense.category && <span aria-hidden>{expense.category.icon}</span>}
                    {expense.name}
                    {pendingItem && (
                      <span className="rounded bg-warn-soft px-1.5 py-0.5 text-xs text-warn">Pendiente</span>
                    )}
                  </div>
                  <CardLabel className="mt-1">
                    Día {expense.dueDay} · {FREQUENCY_LABEL[expense.frequency]} · {expense.account.name}
                  </CardLabel>
                </div>
                <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                  <span className="font-mono text-base font-semibold tabular-nums text-ink">
                    {formatCurrency(expense.amount.toNumber())}
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {pendingItem && (
                      <form
                        action={markFixedExpensePaidAction.bind(
                          null,
                          expense.id,
                          pendingItem.dueDate.toISOString()
                        )}
                      >
                        <button
                          type="submit"
                          className="rounded-lg bg-money-soft px-2 py-1 text-xs font-medium text-money hover:opacity-80"
                        >
                          Pagar
                        </button>
                      </form>
                    )}
                    <Link
                      href={`/money/fixed-expenses/${expense.id}/edit`}
                      className="rounded-lg px-2 py-1 text-xs font-medium text-ink-faint hover:bg-surface-raised hover:text-ink"
                    >
                      Editar
                    </Link>
                    <form action={toggleFixedExpenseActiveAction.bind(null, expense.id)}>
                      <button
                        type="submit"
                        className="rounded-lg px-2 py-1 text-xs font-medium text-ink-faint hover:bg-surface-raised hover:text-ink"
                      >
                        {expense.isActive ? "Desactivar" : "Activar"}
                      </button>
                    </form>
                    <form action={deleteFixedExpenseAction.bind(null, expense.id)}>
                      <button
                        type="submit"
                        className="rounded-lg px-2 py-1 text-xs font-medium text-ink-faint hover:bg-danger-soft hover:text-danger"
                      >
                        Eliminar
                      </button>
                    </form>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
