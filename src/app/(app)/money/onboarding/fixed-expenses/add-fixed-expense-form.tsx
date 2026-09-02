"use client";

import { useActionState } from "react";
import { Select } from "@/components/ui/select";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { addOnboardingFixedExpenseAction, type ActionState } from "../actions";

const initialState: ActionState = undefined;

export function AddFixedExpenseForm({ accounts }: { accounts: { id: string; name: string }[] }) {
  const [state, formAction, pending] = useActionState(addOnboardingFixedExpenseAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-2">
        <Input name="name" required placeholder="Ej. Alquiler" />
        <Input name="amount" type="number" step="0.01" min="0.01" required placeholder="Monto" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Input name="dueDay" type="number" min="1" max="31" required placeholder="Día" />
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
        {pending ? "Agregando…" : "Agregar"}
      </Button>
    </form>
  );
}
