import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Card } from "@/components/ui/card";
import { getT } from "@/lib/i18n";
import { AccountForm } from "../account-form";
import { createAccountAction } from "../actions";

export default async function NewAccountPage() {
  const { t } = await getT();

  return (
    <div className="mx-auto max-w-md">
      <Link href="/money/accounts" className="mb-4 inline-flex items-center gap-1 text-sm text-ink-soft hover:text-ink">
        <ChevronLeft size={16} /> {t.money.accounts.title}
      </Link>

      <Card className="p-6">
        <h1 className="mb-4 font-display text-lg font-bold">{t.money.accounts.newAccount}</h1>
        <AccountForm action={createAccountAction} t={t} />
      </Card>
    </div>
  );
}
