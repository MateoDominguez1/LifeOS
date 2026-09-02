import Link from "next/link";
import { Plus, ArrowLeftRight } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { requireUserId } from "@/lib/auth/session";
import { MoneyNav } from "@/components/money/money-nav";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/money/format";
import { deleteTransactionAction } from "./actions";
import { deleteTransferAction } from "../transfers/actions";

type FeedItem =
  | { kind: "transaction"; id: string; date: Date; icon: string; title: string; subtitle: string; amountLabel: string; amountClass: string }
  | { kind: "transfer"; id: string; date: Date; title: string; subtitle: string; amountLabel: string };

export default async function TransactionsPage() {
  const userId = await requireUserId();
  const [transactions, transfers] = await Promise.all([
    prisma.transaction.findMany({
      where: { userId },
      include: { category: true, account: true },
      orderBy: { date: "desc" },
      take: 50,
    }),
    prisma.transfer.findMany({
      where: { userId },
      include: { fromAccount: true, toAccount: true },
      orderBy: { date: "desc" },
      take: 50,
    }),
  ]);

  const feed: FeedItem[] = [
    ...transactions.map((tx) => ({
      kind: "transaction" as const,
      id: tx.id,
      date: tx.date,
      icon: tx.category?.icon ?? (tx.type === "INCOME" ? "💰" : "📦"),
      title: tx.description,
      subtitle: `${tx.account.name} · ${tx.date.toLocaleDateString("es-AR", { day: "numeric", month: "short" })}`,
      amountLabel: `${tx.type === "INCOME" ? "+" : "-"}${formatCurrency(tx.amount.toNumber())}`,
      amountClass: tx.type === "INCOME" ? "text-money" : "text-ink",
    })),
    ...transfers.map((tr) => ({
      kind: "transfer" as const,
      id: tr.id,
      date: tr.date,
      title: `${tr.fromAccount.name} → ${tr.toAccount.name}`,
      subtitle: tr.date.toLocaleDateString("es-AR", { day: "numeric", month: "short" }),
      amountLabel: formatCurrency(tr.amount.toNumber()),
    })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  return (
    <div>
      <MoneyNav />
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h1 className="font-display text-xl font-bold">Movimientos</h1>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/money/transfers/new"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border px-3 font-display text-sm font-medium text-ink-soft hover:border-accent/50 hover:text-ink"
          >
            <ArrowLeftRight size={15} /> Transferir
          </Link>
          <Link
            href="/money/transactions/new"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-accent px-3 font-display text-sm font-medium text-white hover:opacity-90"
          >
            <Plus size={15} /> Nuevo movimiento
          </Link>
        </div>
      </div>

      {feed.length === 0 ? (
        <Card className="py-10 text-center text-sm text-ink-soft">Todavía no registraste movimientos.</Card>
      ) : (
        <Card className="p-0">
          <div className="flex flex-col divide-y divide-border-soft">
            {feed.map((item) =>
              item.kind === "transaction" ? (
                <div key={`tx-${item.id}`} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span aria-hidden className="text-lg">
                      {item.icon}
                    </span>
                    <div className="min-w-0">
                      <div className="truncate text-sm text-ink">{item.title}</div>
                      <div className="text-xs text-ink-faint">{item.subtitle}</div>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className={`font-mono text-sm font-medium tabular-nums ${item.amountClass}`}>
                      {item.amountLabel}
                    </span>
                    <Link
                      href={`/money/transactions/${item.id}/edit`}
                      className="rounded-lg px-2 py-1 text-xs font-medium text-ink-faint hover:bg-surface-raised hover:text-ink"
                    >
                      Editar
                    </Link>
                    <form action={deleteTransactionAction.bind(null, item.id)}>
                      <button
                        type="submit"
                        className="rounded-lg px-2 py-1 text-xs font-medium text-ink-faint hover:bg-danger-soft hover:text-danger"
                      >
                        Eliminar
                      </button>
                    </form>
                  </div>
                </div>
              ) : (
                <div key={`tr-${item.id}`} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent-ink">
                      <ArrowLeftRight size={14} />
                    </span>
                    <div className="min-w-0">
                      <div className="truncate text-sm text-ink">{item.title}</div>
                      <div className="text-xs text-ink-faint">{item.subtitle}</div>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="font-mono text-sm font-medium tabular-nums text-accent-ink">{item.amountLabel}</span>
                    <form action={deleteTransferAction.bind(null, item.id)}>
                      <button
                        type="submit"
                        className="rounded-lg px-2 py-1 text-xs font-medium text-ink-faint hover:bg-danger-soft hover:text-danger"
                      >
                        Eliminar
                      </button>
                    </form>
                  </div>
                </div>
              )
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
