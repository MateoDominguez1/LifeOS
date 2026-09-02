import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/card";
import { prisma } from "@/lib/db/prisma";
import { requireUserId } from "@/lib/auth/session";
import { AccountForm } from "../../account-form";
import { updateAccountAction } from "../../actions";

export default async function EditAccountPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userId = await requireUserId();
  const account = await prisma.account.findFirst({ where: { id, userId } });
  if (!account) notFound();

  return (
    <div className="mx-auto max-w-md">
      <Link href="/money/accounts" className="mb-4 inline-flex items-center gap-1 text-sm text-ink-soft hover:text-ink">
        <ChevronLeft size={16} /> Cuentas
      </Link>
      <Card className="p-6">
        <h1 className="mb-4 font-display text-lg font-bold">Editar cuenta</h1>
        <AccountForm
          action={updateAccountAction.bind(null, account.id)}
          defaults={{
            name: account.name,
            type: account.type,
            balance: account.balance.toNumber(),
            excludeFromTotal: account.excludeFromTotal,
          }}
          submitLabel="Guardar cambios"
        />
      </Card>
    </div>
  );
}
