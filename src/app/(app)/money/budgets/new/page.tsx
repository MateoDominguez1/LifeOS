import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { requireUserId } from "@/lib/auth/session";
import { Card } from "@/components/ui/card";
import { BudgetForm } from "../budget-form";
import { createBudgetAction } from "../actions";

export default async function NewBudgetPage() {
  const userId = await requireUserId();
  const [categories, accounts] = await Promise.all([
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

  return (
    <div className="mx-auto max-w-md">
      <Link href="/money/budgets" className="mb-4 inline-flex items-center gap-1 text-sm text-ink-soft hover:text-ink">
        <ChevronLeft size={16} /> Presupuestos
      </Link>
      <Card className="p-6">
        <h1 className="mb-4 font-display text-lg font-bold">Nuevo presupuesto</h1>
        <BudgetForm action={createBudgetAction} categories={categories} accounts={accounts} />
      </Card>
    </div>
  );
}
