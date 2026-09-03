import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { requireUserId } from "@/lib/auth/session";
import { Card } from "@/components/ui/card";
import { getT } from "@/lib/i18n";
import { IncomeForm } from "../income-form";
import { createIncomeAction } from "../actions";

export default async function NewIncomePage() {
  const userId = await requireUserId();
  const { t } = await getT();
  const accounts = await prisma.account.findMany({
    where: { userId, isActive: true },
    select: { id: true, name: true },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="mx-auto max-w-md">
      <Link href="/money/income" className="mb-4 inline-flex items-center gap-1 text-sm text-ink-soft hover:text-ink">
        <ChevronLeft size={16} /> {t.money.income.title}
      </Link>
      <Card className="p-6">
        <h1 className="mb-4 font-display text-lg font-bold">{t.money.income.newIncome}</h1>
        {accounts.length === 0 ? (
          <p className="text-sm text-ink-soft">
            {t.money.common.needAccountPrefix}{" "}
            <Link href="/money/accounts/new" className="font-medium text-accent-ink hover:underline">
              {t.money.common.createAccountLink}
            </Link>
            .
          </p>
        ) : (
          <IncomeForm action={createIncomeAction} accounts={accounts} t={t} />
        )}
      </Card>
    </div>
  );
}
