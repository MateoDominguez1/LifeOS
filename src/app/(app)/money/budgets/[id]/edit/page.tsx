import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { requireUserId } from "@/lib/auth/session";
import { Card } from "@/components/ui/card";
import { getT } from "@/lib/i18n";
import { BudgetForm } from "../../budget-form";
import { updateBudgetAction } from "../../actions";

export default async function EditBudgetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [userId, { t }] = await Promise.all([requireUserId(), getT()]);

  const [budget, categories, accounts] = await Promise.all([
    prisma.budget.findFirst({ where: { id, userId } }),
    prisma.category.findMany({
      where: { OR: [{ userId }, { userId: null }] },
      select: { id: true, name: true, icon: true },
      orderBy: { name: "asc" },
    }),
    prisma.account.findMany({
      where: { userId, isActive: true },
      select: { id: true, name: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);
  if (!budget) notFound();

  return (
    <div className="mx-auto max-w-md">
      <Link href="/money/budgets" className="mb-4 inline-flex items-center gap-1 text-sm text-ink-soft hover:text-ink">
        <ChevronLeft size={16} /> {t.money.budgets.title}
      </Link>
      <Card className="p-6">
        <h1 className="mb-4 font-display text-lg font-bold">{t.money.budgets.editBudget}</h1>
        <BudgetForm
          action={updateBudgetAction.bind(null, budget.id)}
          categories={categories}
          accounts={accounts}
          defaults={{
            name: budget.name,
            type: budget.type,
            categoryId: budget.categoryId,
            accountId: budget.accountId ?? "",
            monthlyAmount: budget.monthlyAmount.toNumber(),
            weeklyAmount: budget.weeklyAmount ? budget.weeklyAmount.toNumber() : null,
            isActive: budget.isActive,
          }}
          submitLabel={t.money.common.saveChanges}
          t={t}
        />
      </Card>
    </div>
  );
}
