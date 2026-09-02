"use client";

import { useActionState } from "react";
import { Select } from "@/components/ui/select";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { completeShoppingListAction, discardShoppingListAction, type ActionState } from "./actions";

const initialState: ActionState = undefined;

export function CompleteForm({
  shoppingListId,
  accounts,
  categories,
  defaultAmount,
  defaultAccountId,
  defaultCategoryId,
}: {
  shoppingListId: string;
  accounts: { id: string; name: string }[];
  categories: { id: string; name: string; icon: string }[];
  defaultAmount: number;
  defaultAccountId: string;
  defaultCategoryId: string;
}) {
  const action = completeShoppingListAction.bind(null, shoppingListId);
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <div className="flex flex-col gap-4">
      <form action={formAction} className="flex flex-col gap-4">
        <div>
          <Label htmlFor="amount">Monto</Label>
          <Input id="amount" name="amount" type="number" step="0.01" defaultValue={defaultAmount} required />
        </div>
        <div>
          <Label htmlFor="description">Descripción</Label>
          <Input id="description" name="description" defaultValue="Supermercado" required />
        </div>
        <div>
          <Label htmlFor="accountId">Cuenta</Label>
          <Select id="accountId" name="accountId" defaultValue={defaultAccountId} required>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="categoryId">Categoría</Label>
          <Select id="categoryId" name="categoryId" defaultValue={defaultCategoryId}>
            <option value="">Sin categoría</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.icon} {c.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="date">Fecha</Label>
          <Input id="date" name="date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} required />
        </div>

        {state?.error && <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{state.error}</p>}

        <Button type="submit" disabled={pending} className="w-full">
          {pending ? "Guardando…" : "Marcar como comprada"}
        </Button>
      </form>

      <form action={discardShoppingListAction.bind(null, shoppingListId)}>
        <button type="submit" className="text-sm font-medium text-ink-faint hover:text-danger">
          Descartar lista sin convertirla en gasto
        </button>
      </form>
    </div>
  );
}
