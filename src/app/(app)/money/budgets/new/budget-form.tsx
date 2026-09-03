"use client";

import { useActionState } from "react";
import { Select } from "@/components/ui/select";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { Dictionary } from "@/lib/i18n";
import { createBudgetAction, type ActionState } from "../actions";

const initialState: ActionState = undefined;

export function BudgetForm({
  categories,
  accounts,
  t,
}: {
  categories: { id: string; name: string; icon: string }[];
  accounts: { id: string; name: string }[];
  t: Dictionary;
}) {
  const [state, formAction, pending] = useActionState(createBudgetAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="isActive" value="on" />
      <div>
        <Label htmlFor="name">{t.money.common.name}</Label>
        <Input id="name" name="name" required placeholder={t.money.budgets.namePlaceholder} />
      </div>
      <div>
        <Label htmlFor="type">{t.money.common.typeLabel}</Label>
        <Select id="type" name="type" defaultValue="CUSTOM">
          <option value="GROCERY">{t.money.budgets.typeGrocery}</option>
          <option value="CUSTOM">{t.money.budgets.typeCustom}</option>
        </Select>
      </div>
      <div>
        <Label htmlFor="categoryId">{t.money.common.category}</Label>
        <Select id="categoryId" name="categoryId" required defaultValue="">
          <option value="" disabled>
            {t.money.common.chooseCategory}
          </option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.icon} {c.name}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <Label htmlFor="accountId">{t.money.budgets.dedicatedAccountLabel}</Label>
        <Select id="accountId" name="accountId" defaultValue="">
          <option value="">{t.money.common.anyAccount}</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <Label htmlFor="monthlyAmount">{t.money.budgets.monthlyAmountLabel}</Label>
        <Input id="monthlyAmount" name="monthlyAmount" type="number" step="0.01" min="0.01" required />
      </div>
      <div>
        <Label htmlFor="weeklyAmount">{t.money.budgets.weeklyLimitLabel}</Label>
        <Input id="weeklyAmount" name="weeklyAmount" type="number" step="0.01" />
      </div>

      {state?.error && <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{state.error}</p>}

      <Button type="submit" disabled={pending} className="mt-1 w-full">
        {pending ? t.money.common.creating : t.money.budgets.createSubmit}
      </Button>
    </form>
  );
}
