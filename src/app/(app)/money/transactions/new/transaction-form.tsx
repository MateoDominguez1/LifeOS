"use client";

import { useActionState, useState } from "react";
import { Select } from "@/components/ui/select";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import type { Dictionary } from "@/lib/i18n";
import { createTransactionAction, type ActionState } from "../actions";

const initialState: ActionState = undefined;

export function TransactionForm({
  accounts,
  categories,
  t,
}: {
  accounts: { id: string; name: string }[];
  categories: { id: string; name: string; icon: string }[];
  t: Dictionary;
}) {
  const [state, formAction, pending] = useActionState(createTransactionAction, initialState);
  const [type, setType] = useState<"EXPENSE" | "INCOME">("EXPENSE");

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex gap-2">
        {(["EXPENSE", "INCOME"] as const).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setType(option)}
            className={cn(
              "flex-1 rounded-xl border py-2.5 font-display text-sm font-medium transition-colors",
              type === option
                ? option === "EXPENSE"
                  ? "border-fitness bg-fitness-soft text-fitness"
                  : "border-money bg-money-soft text-money"
                : "border-border text-ink-soft"
            )}
          >
            {option === "EXPENSE" ? t.money.transactions.typeExpense : t.money.transactions.typeIncome}
          </button>
        ))}
        <input type="hidden" name="type" value={type} />
      </div>

      <div>
        <Label htmlFor="description">{t.money.transactions.descriptionLabel}</Label>
        <Input id="description" name="description" required placeholder={t.money.transactions.descriptionPlaceholder} />
      </div>
      <div>
        <Label htmlFor="amount">{t.money.common.amount}</Label>
        <Input id="amount" name="amount" type="number" step="0.01" min="0.01" required />
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
      {type === "EXPENSE" && (
        <div>
          <Label htmlFor="categoryId">{t.money.common.category}</Label>
          <Select id="categoryId" name="categoryId" defaultValue="">
            <option value="">{t.money.common.noCategory}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.icon} {c.name}
              </option>
            ))}
          </Select>
        </div>
      )}
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
        {pending ? t.common.saving : t.money.transactions.createSubmit}
      </Button>
    </form>
  );
}
