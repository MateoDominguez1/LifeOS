import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { requireUserId } from "@/lib/auth/session";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/money/format";
import { getT } from "@/lib/i18n";
import { StepIndicator } from "../step-indicator";
import { AddFixedExpenseForm } from "./add-fixed-expense-form";

export default async function OnboardingFixedExpensesPage() {
  const userId = await requireUserId();
  const { t } = await getT();
  const [accounts, fixedExpenses] = await Promise.all([
    prisma.account.findMany({ where: { userId }, select: { id: true, name: true }, orderBy: { createdAt: "asc" } }),
    prisma.fixedExpense.findMany({ where: { userId }, orderBy: { dueDay: "asc" } }),
  ]);

  return (
    <Card className="p-6">
      <StepIndicator current={2} t={t} />
      <h1 className="font-display text-lg font-bold">{t.money.onboarding.fixedExpensesTitle}</h1>
      <p className="mt-1 text-sm text-ink-soft">{t.money.onboarding.fixedExpensesSubtitle}</p>

      {fixedExpenses.length > 0 && (
        <div className="mt-4 flex flex-col divide-y divide-border-soft rounded-xl border border-border-soft">
          {fixedExpenses.map((e) => (
            <div key={e.id} className="flex items-center justify-between px-3 py-2 text-sm">
              <span className="text-ink">{e.name}</span>
              <span className="font-mono tabular-nums text-ink-soft">{formatCurrency(e.amount.toNumber())}</span>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4">
        <AddFixedExpenseForm accounts={accounts} t={t} />
      </div>

      <Link
        href="/money/onboarding/budget"
        className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-xl bg-accent font-display text-sm font-medium text-white hover:opacity-90"
      >
        {t.money.onboarding.continueSubmit}
      </Link>
    </Card>
  );
}
