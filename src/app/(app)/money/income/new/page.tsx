import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { requireUserId } from "@/lib/auth/session";
import { Card } from "@/components/ui/card";
import { IncomeForm } from "../income-form";
import { createIncomeAction } from "../actions";

export default async function NewIncomePage() {
  const userId = await requireUserId();
  const accounts = await prisma.account.findMany({
    where: { userId, isActive: true },
    select: { id: true, name: true },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="mx-auto max-w-md">
      <Link href="/money/income" className="mb-4 inline-flex items-center gap-1 text-sm text-ink-soft hover:text-ink">
        <ChevronLeft size={16} /> Ingresos
      </Link>
      <Card className="p-6">
        <h1 className="mb-4 font-display text-lg font-bold">Nuevo ingreso</h1>
        {accounts.length === 0 ? (
          <p className="text-sm text-ink-soft">
            Primero necesitás{" "}
            <Link href="/money/accounts/new" className="font-medium text-accent-ink hover:underline">
              crear una cuenta
            </Link>
            .
          </p>
        ) : (
          <IncomeForm action={createIncomeAction} accounts={accounts} />
        )}
      </Card>
    </div>
  );
}
