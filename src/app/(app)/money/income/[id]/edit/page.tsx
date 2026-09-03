import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { requireUserId } from "@/lib/auth/session";
import { Card } from "@/components/ui/card";
import { getT } from "@/lib/i18n";
import { IncomeForm } from "../../income-form";
import { updateIncomeAction } from "../../actions";

export default async function EditIncomePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [userId, { t }] = await Promise.all([requireUserId(), getT()]);

  const [income, accounts] = await Promise.all([
    prisma.income.findFirst({ where: { id, userId } }),
    prisma.account.findMany({
      where: { userId, isActive: true },
      select: { id: true, name: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);
  if (!income) notFound();

  return (
    <div className="mx-auto max-w-md">
      <Link href="/money/income" className="mb-4 inline-flex items-center gap-1 text-sm text-ink-soft hover:text-ink">
        <ChevronLeft size={16} /> {t.money.income.title}
      </Link>
      <Card className="p-6">
        <h1 className="mb-4 font-display text-lg font-bold">{t.money.income.editIncome}</h1>
        <IncomeForm
          action={updateIncomeAction.bind(null, income.id)}
          accounts={accounts}
          defaults={{
            name: income.name,
            amount: income.amount ? income.amount.toNumber() : null,
            dayOfMonth: income.dayOfMonth,
            frequency: income.frequency,
            accountId: income.accountId,
            isActive: income.isActive,
          }}
          submitLabel={t.money.common.saveChanges}
          t={t}
        />
      </Card>
    </div>
  );
}
