import Link from "next/link";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { requireUserId } from "@/lib/auth/session";
import { MoneyNav } from "@/components/money/money-nav";
import { Card, CardLabel } from "@/components/ui/card";
import { formatCurrency } from "@/lib/money/format";
import { getT } from "@/lib/i18n";
import { deleteIncomeAction, toggleIncomeActiveAction } from "./actions";

export default async function IncomePage() {
  const userId = await requireUserId();
  const { t } = await getT();

  const FREQUENCY_LABEL: Record<string, string> = {
    WEEKLY: t.money.common.frequencyWeekly,
    MONTHLY: t.money.common.frequencyMonthly,
    YEARLY: t.money.common.frequencyYearly,
  };

  const incomes = await prisma.income.findMany({
    where: { userId },
    include: { account: true },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div>
      <MoneyNav />
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h1 className="font-display text-xl font-bold">{t.money.income.title}</h1>
        <Link
          href="/money/income/new"
          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-accent px-3 font-display text-sm font-medium text-white hover:opacity-90"
        >
          <Plus size={15} /> {t.money.income.newIncome}
        </Link>
      </div>

      {incomes.length === 0 ? (
        <Card className="py-10 text-center text-sm text-ink-soft">{t.money.income.empty}</Card>
      ) : (
        <div className="flex flex-col gap-3">
          {incomes.map((income) => (
            <Card key={income.id} domain={income.isActive ? "money" : "neutral"} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="text-ink">{income.name}</div>
                <CardLabel className="mt-1">
                  {t.money.common.dayLabel} {income.dayOfMonth} · {FREQUENCY_LABEL[income.frequency]} · {income.account.name}
                </CardLabel>
              </div>
              <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                <span className="font-mono text-base font-semibold tabular-nums text-ink">
                  {income.amount ? formatCurrency(income.amount.toNumber()) : t.money.income.variable}
                </span>
                <div className="flex flex-wrap gap-1">
                  <Link
                    href={`/money/income/${income.id}/edit`}
                    className="rounded-lg px-2 py-1 text-xs font-medium text-ink-faint hover:bg-surface-raised hover:text-ink"
                  >
                    {t.common.edit}
                  </Link>
                  <form action={toggleIncomeActiveAction.bind(null, income.id)}>
                    <button
                      type="submit"
                      className="rounded-lg px-2 py-1 text-xs font-medium text-ink-faint hover:bg-surface-raised hover:text-ink"
                    >
                      {income.isActive ? t.money.common.deactivate : t.money.common.activate}
                    </button>
                  </form>
                  <form action={deleteIncomeAction.bind(null, income.id)}>
                    <button
                      type="submit"
                      className="rounded-lg px-2 py-1 text-xs font-medium text-ink-faint hover:bg-danger-soft hover:text-danger"
                    >
                      {t.common.delete}
                    </button>
                  </form>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
