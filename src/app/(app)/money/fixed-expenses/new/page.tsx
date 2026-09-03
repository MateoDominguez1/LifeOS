import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { requireUserId } from "@/lib/auth/session";
import { Card } from "@/components/ui/card";
import { getT } from "@/lib/i18n";
import { FixedExpenseForm } from "../fixed-expense-form";
import { createFixedExpenseAction } from "../actions";

export default async function NewFixedExpensePage() {
  const userId = await requireUserId();
  const { t } = await getT();
  const [accounts, categories] = await Promise.all([
    prisma.account.findMany({
      where: { userId, isActive: true },
      select: { id: true, name: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.category.findMany({
      where: { OR: [{ userId }, { userId: null }] },
      select: { id: true, name: true, icon: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="mx-auto max-w-md">
      <Link href="/money/fixed-expenses" className="mb-4 inline-flex items-center gap-1 text-sm text-ink-soft hover:text-ink">
        <ChevronLeft size={16} /> {t.money.fixedExpenses.title}
      </Link>
      <Card className="p-6">
        <h1 className="mb-4 font-display text-lg font-bold">{t.money.fixedExpenses.newFixedExpense}</h1>
        {accounts.length === 0 ? (
          <p className="text-sm text-ink-soft">
            {t.money.common.needAccountPrefix}{" "}
            <Link href="/money/accounts/new" className="font-medium text-accent-ink hover:underline">
              {t.money.common.createAccountLink}
            </Link>
            .
          </p>
        ) : (
          <FixedExpenseForm action={createFixedExpenseAction} accounts={accounts} categories={categories} t={t} />
        )}
      </Card>
    </div>
  );
}
