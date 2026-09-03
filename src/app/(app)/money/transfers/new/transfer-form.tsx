"use client";

import { useActionState } from "react";
import { Select } from "@/components/ui/select";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { Dictionary } from "@/lib/i18n";
import { createTransferAction, type ActionState } from "../actions";

const initialState: ActionState = undefined;

export function TransferForm({ accounts, t }: { accounts: { id: string; name: string }[]; t: Dictionary }) {
  const [state, formAction, pending] = useActionState(createTransferAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div>
        <Label htmlFor="fromAccountId">{t.money.transfers.fromLabel}</Label>
        <Select id="fromAccountId" name="fromAccountId" required defaultValue="">
          <option value="" disabled>
            {t.money.common.chooseAccount}
          </option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <Label htmlFor="toAccountId">{t.money.transfers.toLabel}</Label>
        <Select id="toAccountId" name="toAccountId" required defaultValue="">
          <option value="" disabled>
            {t.money.common.chooseAccount}
          </option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <Label htmlFor="amount">{t.money.common.amount}</Label>
        <Input id="amount" name="amount" type="number" step="0.01" min="0.01" required />
      </div>
      <div>
        <Label htmlFor="date">{t.money.common.date}</Label>
        <Input id="date" name="date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} required />
      </div>
      <div>
        <Label htmlFor="note">{t.money.common.noteOptional}</Label>
        <Input id="note" name="note" />
      </div>

      {state?.error && <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{state.error}</p>}

      <Button type="submit" disabled={pending} className="mt-1 w-full">
        {pending ? t.money.common.transferring : t.money.common.transfer}
      </Button>
    </form>
  );
}
