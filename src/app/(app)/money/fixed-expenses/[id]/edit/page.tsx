import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { requireUserId } from "@/lib/auth/session";
import { Card } from "@/components/ui/card";
import { getT } from "@/lib/i18n";
import { FixedExpenseForm } from "../../fixed-expense-form";
import { updateFixedExpenseAction } from "../../actions";

export default async function EditFixedExpensePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [userId, { t }] = await Promise.all([requireUserId(), getT()]);

  const [expense, accounts, categories] = await Promise.all([
    prisma.fixedExpense.findFirst({ where: { id, userId } }),
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
  if (!expense) notFound();

  return (
    <div className="mx-auto max-w-md">
      <Link href="/money/fixed-expenses" className="mb-4 inline-flex items-center gap-1 text-sm text-ink-soft hover:text-ink">
        <ChevronLeft size={16} /> {t.money.fixedExpenses.title}
      </Link>
      <Card className="p-6">
        <h1 className="mb-4 font-display text-lg font-bold">{t.money.fixedExpenses.editFixedExpense}</h1>
        <FixedExpenseForm
          action={updateFixedExpenseAction.bind(null, expense.id)}
          accounts={accounts}
          categories={categories}
          defaults={{
            name: expense.name,
            amount: expense.amount.toNumber(),
            dueDay: expense.dueDay,
            accountId: expense.accountId,
            categoryId: expense.categoryId ?? "",
            frequency: expense.frequency,
            startDate: expense.startDate.toISOString().slice(0, 10),
            isActive: expense.isActive,
          }}
          submitLabel={t.money.common.saveChanges}
          t={t}
        />
      </Card>
    </div>
  );
}
