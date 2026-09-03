import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/card";
import { prisma } from "@/lib/db/prisma";
import { requireUserId } from "@/lib/auth/session";
import { getT } from "@/lib/i18n";
import { AccountForm } from "../../account-form";
import { updateAccountAction } from "../../actions";

export default async function EditAccountPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [userId, { t }] = await Promise.all([requireUserId(), getT()]);
  const account = await prisma.account.findFirst({ where: { id, userId } });
  if (!account) notFound();

  return (
    <div className="mx-auto max-w-md">
      <Link href="/money/accounts" className="mb-4 inline-flex items-center gap-1 text-sm text-ink-soft hover:text-ink">
        <ChevronLeft size={16} /> {t.money.accounts.title}
      </Link>
      <Card className="p-6">
        <h1 className="mb-4 font-display text-lg font-bold">{t.money.accounts.editAccount}</h1>
        <AccountForm
          action={updateAccountAction.bind(null, account.id)}
          defaults={{
            name: account.name,
            type: account.type,
            balance: account.balance.toNumber(),
            excludeFromTotal: account.excludeFromTotal,
          }}
          submitLabel={t.money.common.saveChanges}
          t={t}
        />
      </Card>
    </div>
  );
}
