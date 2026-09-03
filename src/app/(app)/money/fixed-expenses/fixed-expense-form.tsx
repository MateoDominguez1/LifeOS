"use client";

import { useActionState } from "react";
import { Select } from "@/components/ui/select";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { Dictionary } from "@/lib/i18n";
import type { ActionState } from "./actions";

const initialState: ActionState = undefined;

export function FixedExpenseForm({
  action,
  accounts,
  categories,
  defaults,
  submitLabel,
  t,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  accounts: { id: string; name: string }[];
  categories: { id: string; name: string; icon: string }[];
  defaults?: {
    name: string;
    amount: number;
    dueDay: number;
    accountId: string;
    categoryId: string;
    frequency: string;
    startDate: string;
    isActive: boolean;
  };
  submitLabel?: string;
  t: Dictionary;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {!defaults && <input type="hidden" name="isActive" value="on" />}
      <div>
        <Label htmlFor="name">{t.money.common.name}</Label>
        <Input id="name" name="name" required placeholder={t.money.fixedExpenses.namePlaceholder} defaultValue={defaults?.name} />
      </div>
      <div>
        <Label htmlFor="amount">{t.money.common.amount}</Label>
        <Input
          id="amount"
          name="amount"
          type="number"
          step="0.01"
          min="0.01"
          required
          defaultValue={defaults?.amount}
        />
      </div>
      <div>
        <Label htmlFor="frequency">{t.money.common.frequency}</Label>
        <Select id="frequency" name="frequency" defaultValue={defaults?.frequency ?? "MONTHLY"}>
          <option value="WEEKLY">{t.money.common.frequencyWeekly}</option>
          <option value="MONTHLY">{t.money.common.frequencyMonthly}</option>
          <option value="YEARLY">{t.money.common.frequencyYearly}</option>
        </Select>
      </div>
      <div>
        <Label htmlFor="dueDay">{t.money.fixedExpenses.dueDayLabel}</Label>
        <Input
          id="dueDay"
          name="dueDay"
          type="number"
          min="0"
          max="31"
          required
          defaultValue={defaults?.dueDay ?? 1}
        />
      </div>
      <div>
        <Label htmlFor="accountId">{t.money.common.account}</Label>
        <Select id="accountId" name="accountId" required defaultValue={defaults?.accountId ?? ""}>
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
        <Label htmlFor="categoryId">{t.money.fixedExpenses.categoryOptionalLabel}</Label>
        <Select id="categoryId" name="categoryId" defaultValue={defaults?.categoryId ?? ""}>
          <option value="">{t.money.common.noCategory}</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.icon} {c.name}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <Label htmlFor="startDate">{t.money.fixedExpenses.startsLabel}</Label>
        <Input
          id="startDate"
          name="startDate"
          type="date"
          defaultValue={defaults?.startDate ?? new Date().toISOString().slice(0, 10)}
          required
        />
      </div>
      {defaults && (
        <label className="flex items-center gap-2 text-sm text-ink-soft">
          <input
            type="checkbox"
            name="isActive"
            defaultChecked={defaults.isActive}
            className="h-4 w-4 rounded border-border"
          />
          {t.money.fixedExpenses.activeLabel}
        </label>
      )}

      {state?.error && <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{state.error}</p>}

      <Button type="submit" disabled={pending} className="mt-1 w-full">
        {pending ? t.common.saving : (submitLabel ?? t.money.fixedExpenses.createSubmit)}
      </Button>
    </form>
  );
}
