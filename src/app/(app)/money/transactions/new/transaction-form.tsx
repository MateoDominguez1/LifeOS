"use client";

import { useActionState, useState } from "react";
import { Select } from "@/components/ui/select";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { createTransactionAction, type ActionState } from "../actions";

const initialState: ActionState = undefined;

export function TransactionForm({
  accounts,
  categories,
}: {
  accounts: { id: string; name: string }[];
  categories: { id: string; name: string; icon: string }[];
}) {
  const [state, formAction, pending] = useActionState(createTransactionAction, initialState);
  const [type, setType] = useState<"EXPENSE" | "INCOME">("EXPENSE");

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex gap-2">
        {(["EXPENSE", "INCOME"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setType(t)}
            className={cn(
              "flex-1 rounded-xl border py-2.5 font-display text-sm font-medium transition-colors",
              type === t
                ? t === "EXPENSE"
                  ? "border-fitness bg-fitness-soft text-fitness"
                  : "border-money bg-money-soft text-money"
                : "border-border text-ink-soft"
            )}
          >
            {t === "EXPENSE" ? "Gasto" : "Ingreso"}
          </button>
        ))}
        <input type="hidden" name="type" value={type} />
      </div>

      <div>
        <Label htmlFor="description">Descripción</Label>
        <Input id="description" name="description" required placeholder="Ej. Supermercado" />
      </div>
      <div>
        <Label htmlFor="amount">Monto</Label>
        <Input id="amount" name="amount" type="number" step="0.01" min="0.01" required />
      </div>
      <div>
        <Label htmlFor="accountId">Cuenta</Label>
        <Select id="accountId" name="accountId" required defaultValue="">
          <option value="" disabled>
            Elegí una cuenta
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
          <Label htmlFor="categoryId">Categoría</Label>
          <Select id="categoryId" name="categoryId" defaultValue="">
            <option value="">Sin categoría</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.icon} {c.name}
              </option>
            ))}
          </Select>
        </div>
      )}
      <div>
        <Label htmlFor="date">Fecha</Label>
        <Input id="date" name="date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} required />
      </div>
      <div>
        <Label htmlFor="note">Nota (opcional)</Label>
        <Input id="note" name="note" />
      </div>

      {state?.error && <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{state.error}</p>}

      <Button type="submit" disabled={pending} className="mt-1 w-full">
        {pending ? "Guardando…" : "Guardar movimiento"}
      </Button>
    </form>
  );
}
