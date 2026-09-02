import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { requireUserId } from "@/lib/auth/session";
import { Card } from "@/components/ui/card";
import { TransactionForm } from "../../transaction-form";
import { updateTransactionAction } from "../../actions";

export default async function EditTransactionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userId = await requireUserId();

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
        <ChevronLeft size={16} /> Movimientos
      </Link>
      <Card className="p-6">
        <h1 className="mb-4 font-display text-lg font-bold">Editar movimiento</h1>
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
          submitLabel="Guardar cambios"
        />
      </Card>
    </div>
  );
}
