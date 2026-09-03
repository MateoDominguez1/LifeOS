import Link from "next/link";
import { Plus, ArrowLeftRight } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { requireUserId } from "@/lib/auth/session";
import { MoneyNav } from "@/components/money/money-nav";
import { Card, CardLabel } from "@/components/ui/card";
import { formatCurrency } from "@/lib/money/format";
import { getT } from "@/lib/i18n";
import { deleteAccountAction, toggleAccountActiveAction } from "./actions";

export default async function AccountsPage() {
  const userId = await requireUserId();
  const { t } = await getT();
  const accounts = await prisma.account.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });

  const ACCOUNT_TYPE_LABEL: Record<string, string> = {
    CHECKING: t.money.accounts.typeChecking,
    SAVINGS: t.money.accounts.typeSavings,
    CASH: t.money.accounts.typeCash,
    CARD: t.money.accounts.typeCard,
    OTHER: t.money.accounts.typeOther,
  };

  return (
    <div>
      <MoneyNav />
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h1 className="font-display text-xl font-bold">{t.money.accounts.title}</h1>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/money/transfers/new"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border px-3 font-display text-sm font-medium text-ink-soft hover:border-accent/50 hover:text-ink"
          >
            <ArrowLeftRight size={15} /> {t.money.common.transfer}
          </Link>
          <Link
            href="/money/accounts/new"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-accent px-3 font-display text-sm font-medium text-white hover:opacity-90"
          >
            <Plus size={15} /> {t.money.accounts.newAccount}
          </Link>
        </div>
      </div>

      {accounts.length === 0 ? (
        <Card className="py-10 text-center text-sm text-ink-soft">{t.money.accounts.empty}</Card>
      ) : (
        <div className="flex flex-col gap-3">
          {accounts.map((account) => (
            <Card key={account.id} domain={account.isActive ? "money" : "neutral"} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-ink">{account.name}</span>
                  {!account.isActive && (
                    <span className="rounded bg-border-soft px-1.5 py-0.5 text-xs text-ink-faint">{t.money.accounts.inactive}</span>
                  )}
                  {account.excludeFromTotal && (
                    <span className="rounded bg-accent-soft px-1.5 py-0.5 text-xs text-accent-ink">{t.money.accounts.excluded}</span>
                  )}
                </div>
                <CardLabel className="mt-1">{ACCOUNT_TYPE_LABEL[account.type] ?? account.type}</CardLabel>
              </div>
              <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                <span className="font-mono text-base font-semibold tabular-nums text-ink">
                  {formatCurrency(account.balance.toNumber())}
                </span>
                <div className="flex flex-wrap gap-1">
                  <Link
                    href={`/money/accounts/${account.id}/edit`}
                    className="rounded-lg px-2 py-1 text-xs font-medium text-ink-faint hover:bg-surface-raised hover:text-ink"
                  >
                    {t.common.edit}
                  </Link>
                  <form action={toggleAccountActiveAction.bind(null, account.id)}>
                    <button
                      type="submit"
                      className="rounded-lg px-2 py-1 text-xs font-medium text-ink-faint hover:bg-surface-raised hover:text-ink"
                    >
                      {account.isActive ? t.money.common.deactivate : t.money.common.activate}
                    </button>
                  </form>
                  <form action={deleteAccountAction.bind(null, account.id)}>
                    <button
                      type="submit"
                      className="rounded-lg px-2 py-1 text-xs font-medium text-ink-faint hover:bg-danger-soft hover:text-danger"
                    >
                      {t.common.delete}
                    </button>
                  </form>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
