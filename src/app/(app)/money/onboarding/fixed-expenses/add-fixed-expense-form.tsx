"use client";

import { useActionState } from "react";
import { Select } from "@/components/ui/select";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { Dictionary } from "@/lib/i18n";
import { addOnboardingFixedExpenseAction, type ActionState } from "../actions";

const initialState: ActionState = undefined;

export function AddFixedExpenseForm({ accounts, t }: { accounts: { id: string; name: string }[]; t: Dictionary }) {
  const [state, formAction, pending] = useActionState(addOnboardingFixedExpenseAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-2">
        <Input name="name" required placeholder={t.money.fixedExpenses.namePlaceholder} />
        <Input name="amount" type="number" step="0.01" min="0.01" required placeholder={t.money.common.amount} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Input name="dueDay" type="number" min="1" max="31" required placeholder={t.money.common.dayLabel} />
        <Select name="accountId" required defaultValue={accounts[0]?.id ?? ""}>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </Select>
      </div>
      {state?.error && <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{state.error}</p>}
      <Button type="submit" variant="secondary" disabled={pending}>
        {pending ? t.money.common.adding : t.common.add}
      </Button>
    </form>
  );
}
