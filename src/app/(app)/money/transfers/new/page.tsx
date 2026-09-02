import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { requireUserId } from "@/lib/auth/session";
import { Card } from "@/components/ui/card";
import { TransferForm } from "./transfer-form";

export default async function NewTransferPage() {
  const userId = await requireUserId();
  const accounts = await prisma.account.findMany({
    where: { userId, isActive: true },
    select: { id: true, name: true },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="mx-auto max-w-md">
      <Link href="/money/accounts" className="mb-4 inline-flex items-center gap-1 text-sm text-ink-soft hover:text-ink">
        <ChevronLeft size={16} /> Cuentas
      </Link>
      <Card className="p-6">
        <h1 className="mb-4 font-display text-lg font-bold">Transferir entre cuentas</h1>
        <TransferForm accounts={accounts} />
      </Card>
    </div>
  );
}
