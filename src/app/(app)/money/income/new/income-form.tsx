"use client";

import { useActionState } from "react";
import { Select } from "@/components/ui/select";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { Dictionary } from "@/lib/i18n";
import { createIncomeAction, type ActionState } from "../actions";

const initialState: ActionState = undefined;

export function IncomeForm({ accounts, t }: { accounts: { id: string; name: string }[]; t: Dictionary }) {
  const [state, formAction, pending] = useActionState(createIncomeAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="isActive" value="on" />
      <div>
        <Label htmlFor="name">{t.money.common.name}</Label>
        <Input id="name" name="name" required placeholder={t.money.income.namePlaceholder} />
      </div>
      <div>
        <Label htmlFor="amount">{t.money.income.amountVariableHint}</Label>
        <Input id="amount" name="amount" type="number" step="0.01" />
      </div>
      <div>
        <Label htmlFor="dayOfMonth">{t.money.income.dayOfMonthLabel}</Label>
        <Input id="dayOfMonth" name="dayOfMonth" type="number" min="1" max="31" required defaultValue="1" />
      </div>
      <div>
        <Label htmlFor="frequency">{t.money.common.frequency}</Label>
        <Select id="frequency" name="frequency" defaultValue="MONTHLY">
          <option value="WEEKLY">{t.money.common.frequencyWeekly}</option>
          <option value="MONTHLY">{t.money.common.frequencyMonthly}</option>
          <option value="YEARLY">{t.money.common.frequencyYearly}</option>
        </Select>
      </div>
      <div>
        <Label htmlFor="accountId">{t.money.common.account}</Label>
        <Select id="accountId" name="accountId" required defaultValue="">
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

      {state?.error && <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{state.error}</p>}

      <Button type="submit" disabled={pending} className="mt-1 w-full">
        {pending ? t.money.common.creating : t.money.income.createSubmit}
      </Button>
    </form>
  );
}
