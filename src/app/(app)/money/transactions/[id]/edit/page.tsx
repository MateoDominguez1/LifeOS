import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { requireUserId } from "@/lib/auth/session";
import { Card } from "@/components/ui/card";
import { getT } from "@/lib/i18n";
import { TransactionForm } from "../../transaction-form";
import { updateTransactionAction } from "../../actions";

export default async function EditTransactionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [userId, { t }] = await Promise.all([requireUserId(), getT()]);

  const [transaction, accounts, categories] = await Promise.all([
    prisma.transaction.findFirst({ where: { id, userId } }),
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
  if (!transaction) notFound();

  return (
    <div className="mx-auto max-w-md">
      <Link href="/money/transactions" className="mb-4 inline-flex items-center gap-1 text-sm text-ink-soft hover:text-ink">
        <ChevronLeft size={16} /> {t.money.transactions.title}
      </Link>
      <Card className="p-6">
        <h1 className="mb-4 font-display text-lg font-bold">{t.money.transactions.editTransaction}</h1>
        <TransactionForm
          action={updateTransactionAction.bind(null, transaction.id)}
          accounts={accounts}
          categories={categories}
          transactionId={transaction.id}
          hasExistingReceipt={Boolean(transaction.receiptData)}
          defaults={{
            type: transaction.type,
            amount: transaction.amount.toNumber(),
            description: transaction.description,
            categoryId: transaction.categoryId ?? "",
            accountId: transaction.accountId,
            date: transaction.date.toISOString().slice(0, 10),
            note: transaction.note ?? "",
          }}
          submitLabel={t.money.common.saveChanges}
          t={t}
        />
      </Card>
    </div>
  );
}
