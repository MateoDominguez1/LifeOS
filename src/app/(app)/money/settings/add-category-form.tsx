"use client";

import { useActionState } from "react";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { Dictionary } from "@/lib/i18n";
import { createCategoryAction, type ActionState } from "./actions";

const initialState: ActionState = undefined;

export function AddCategoryForm({ t }: { t: Dictionary }) {
  const [state, formAction, pending] = useActionState(createCategoryAction, initialState);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2">
      <div className="w-16">
        <Label htmlFor="icon">{t.money.settings.emojiLabel}</Label>
        <Input id="icon" name="icon" maxLength={4} defaultValue="🏷️" className="text-center" />
      </div>
      <div className="min-w-[160px] flex-1">
        <Label htmlFor="name">{t.money.common.name}</Label>
        <Input id="name" name="name" required placeholder={t.money.settings.categoryNamePlaceholder} />
      </div>
      <div>
        <Label htmlFor="color">{t.money.settings.colorLabel}</Label>
        <input
          id="color"
          name="color"
          type="color"
          defaultValue="#5b5bf6"
          className="h-11 w-16 rounded-xl border border-border bg-surface"
        />
      </div>
      <Button type="submit" variant="secondary" disabled={pending}>
        {pending ? t.money.common.adding : t.common.add}
      </Button>
      {state?.error && <p className="w-full text-sm text-danger">{state.error}</p>}
    </form>
  );
}
