import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Card } from "@/components/ui/card";
import { AccountForm } from "../account-form";
import { createAccountAction } from "../actions";

export default function NewAccountPage() {
  return (
    <div className="mx-auto max-w-md">
      <Link href="/money/accounts" className="mb-4 inline-flex items-center gap-1 text-sm text-ink-soft hover:text-ink">
        <ChevronLeft size={16} /> Cuentas
      </Link>

      <Card className="p-6">
        <h1 className="mb-4 font-display text-lg font-bold">Nueva cuenta</h1>
        <AccountForm action={createAccountAction} />
      </Card>
    </div>
  );
}
