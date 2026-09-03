"use client";

import { useActionState } from "react";
import { Select } from "@/components/ui/select";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { Dictionary } from "@/lib/i18n";
import type { ActionState } from "./actions";

const initialState: ActionState = undefined;

export function AccountForm({
  action,
  defaults,
  submitLabel,
  t,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  defaults?: {
    name: string;
    type: string;
    balance: number;
    excludeFromTotal: boolean;
  };
  submitLabel?: string;
  t: Dictionary;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);

  const ACCOUNT_TYPES: { value: string; label: string }[] = [
    { value: "CHECKING", label: t.money.accounts.typeChecking },
    { value: "SAVINGS", label: t.money.accounts.typeSavings },
    { value: "CASH", label: t.money.accounts.typeCash },
    { value: "CARD", label: t.money.accounts.typeCard },
    { value: "OTHER", label: t.money.accounts.typeOther },
  ];

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div>
        <Label htmlFor="name">{t.money.common.name}</Label>
        <Input id="name" name="name" required placeholder={t.money.accounts.namePlaceholder} defaultValue={defaults?.name} />
      </div>
      <div>
        <Label htmlFor="type">{t.money.common.typeLabel}</Label>
        <Select id="type" name="type" defaultValue={defaults?.type ?? "CHECKING"}>
          {ACCOUNT_TYPES.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <Label htmlFor="balance">
          {t.money.accounts.balanceLabel}
          {defaults ? "" : t.money.accounts.balanceInitialSuffix}
        </Label>
        <Input
          id="balance"
          name="balance"
          type="number"
          step="0.01"
          defaultValue={defaults?.balance ?? 0}
          required
        />
      </div>
      <label className="flex items-center gap-2 text-sm text-ink-soft">
        <input
          type="checkbox"
          name="excludeFromTotal"
          defaultChecked={defaults?.excludeFromTotal}
          className="h-4 w-4 rounded border-border"
        />
        {t.money.accounts.excludeFromTotalLabel}
      </label>

      {state?.error && (
        <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{state.error}</p>
      )}

      <Button type="submit" disabled={pending} className="mt-1 w-full">
        {pending ? t.common.saving : (submitLabel ?? t.money.accounts.createSubmit)}
      </Button>
    </form>
  );
}
