"use client";

import { useActionState } from "react";
import { Select } from "@/components/ui/select";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { Dictionary } from "@/lib/i18n";
import { completeShoppingListAction, discardShoppingListAction, type ActionState } from "./actions";

const initialState: ActionState = undefined;

export function CompleteForm({
  shoppingListId,
  accounts,
  categories,
  defaultAmount,
  defaultAccountId,
  defaultCategoryId,
  t,
}: {
  shoppingListId: string;
  accounts: { id: string; name: string }[];
  categories: { id: string; name: string; icon: string }[];
  defaultAmount: number;
  defaultAccountId: string;
  defaultCategoryId: string;
  t: Dictionary;
}) {
  const action = completeShoppingListAction.bind(null, shoppingListId);
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <div className="flex flex-col gap-4">
      <form action={formAction} className="flex flex-col gap-4">
        <div>
          <Label htmlFor="amount">{t.money.common.amount}</Label>
          <Input id="amount" name="amount" type="number" step="0.01" defaultValue={defaultAmount} required />
        </div>
        <div>
          <Label htmlFor="description">{t.money.transactions.descriptionLabel}</Label>
          <Input id="description" name="description" defaultValue={t.money.shoppingList.defaultDescription} required />
        </div>
        <div>
          <Label htmlFor="accountId">{t.money.common.account}</Label>
          <Select id="accountId" name="accountId" defaultValue={defaultAccountId} required>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="categoryId">{t.money.common.category}</Label>
          <Select id="categoryId" name="categoryId" defaultValue={defaultCategoryId}>
            <option value="">{t.money.common.noCategory}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.icon} {c.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="date">{t.money.common.date}</Label>
          <Input id="date" name="date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} required />
        </div>

        {state?.error && <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{state.error}</p>}

        <Button type="submit" disabled={pending} className="w-full">
          {pending ? t.common.saving : t.money.shoppingList.markAsPurchased}
        </Button>
      </form>

      <form action={discardShoppingListAction.bind(null, shoppingListId)}>
        <button type="submit" className="text-sm font-medium text-ink-faint hover:text-danger">
          {t.money.shoppingList.discardList}
        </button>
      </form>
    </div>
  );
}
