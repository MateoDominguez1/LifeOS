"use client";

import { useActionState } from "react";
import { Select } from "@/components/ui/select";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { Dictionary } from "@/lib/i18n";
import type { ActionState } from "./actions";

const initialState: ActionState = undefined;

export function ImportantDateForm({
  action,
  defaults,
  submitLabel,
  t,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  defaults?: {
    personName: string;
    relationship: string;
    type: string;
    date: string;
    note: string;
    reminderDaysBefore: number;
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
        <Label htmlFor="personName">{t.money.common.name}</Label>
        <Input id="personName" name="personName" required placeholder={t.money.importantDates.personNamePlaceholder} defaultValue={defaults?.personName} />
      </div>
      <div>
        <Label htmlFor="relationship">{t.money.importantDates.relationshipLabel}</Label>
        <Input id="relationship" name="relationship" placeholder={t.money.importantDates.relationshipPlaceholder} defaultValue={defaults?.relationship} />
      </div>
      <div>
        <Label htmlFor="type">{t.money.common.typeLabel}</Label>
        <Select id="type" name="type" defaultValue={defaults?.type ?? "BIRTHDAY"}>
          <option value="BIRTHDAY">{t.money.importantDates.typeBirthday}</option>
          <option value="ANNIVERSARY">{t.money.importantDates.typeAnniversary}</option>
          <option value="OTHER">{t.money.importantDates.typeOther}</option>
        </Select>
      </div>
      <div>
        <Label htmlFor="date">{t.money.common.date}</Label>
        <Input id="date" name="date" type="date" required defaultValue={defaults?.date} />
      </div>
      <div>
        <Label htmlFor="reminderDaysBefore">{t.money.importantDates.reminderLabel}</Label>
        <Input
          id="reminderDaysBefore"
          name="reminderDaysBefore"
          type="number"
          min="0"
          max="180"
          defaultValue={defaults?.reminderDaysBefore ?? 14}
        />
      </div>
      <div>
        <Label htmlFor="note">{t.money.common.noteOptional}</Label>
        <Input id="note" name="note" defaultValue={defaults?.note} />
      </div>
      {defaults && (
        <label className="flex items-center gap-2 text-sm text-ink-soft">
          <input
            type="checkbox"
            name="isActive"
            defaultChecked={defaults.isActive}
            className="h-4 w-4 rounded border-border"
          />
          {t.money.common.active}
        </label>
      )}

      {state?.error && <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{state.error}</p>}

      <Button type="submit" disabled={pending} className="mt-1 w-full">
        {pending ? t.common.saving : (submitLabel ?? t.money.importantDates.createSubmit)}
      </Button>
    </form>
  );
}
