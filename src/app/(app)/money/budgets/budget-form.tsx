"use client";

import { useActionState } from "react";
import { Select } from "@/components/ui/select";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { ActionState } from "./actions";

const initialState: ActionState = undefined;

export function BudgetForm({
  action,
  categories,
  accounts,
  defaults,
  submitLabel = "Crear presupuesto",
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  categories: { id: string; name: string; icon: string }[];
  accounts: { id: string; name: string }[];
  defaults?: {
    name: string;
    type: string;
    categoryId: string;
    accountId: string;
    monthlyAmount: number;
    weeklyAmount: number | null;
    isActive: boolean;
  };
  submitLabel?: string;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {!defaults && <input type="hidden" name="isActive" value="on" />}
      <div>
        <Label htmlFor="name">Nombre</Label>
        <Input id="name" name="name" required placeholder="Ej. Supermercado" defaultValue={defaults?.name} />
      </div>
      <div>
        <Label htmlFor="type">Tipo</Label>
        <Select id="type" name="type" defaultValue={defaults?.type ?? "CUSTOM"}>
          <option value="GROCERY">Supermercado</option>
          <option value="CUSTOM">Personalizado</option>
        </Select>
      </div>
      <div>
        <Label htmlFor="categoryId">Categoría</Label>
        <Select id="categoryId" name="categoryId" required defaultValue={defaults?.categoryId ?? ""}>
          <option value="" disabled>
            Elegí una categoría
          </option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.icon} {c.name}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <Label htmlFor="accountId">Cuenta dedicada (opcional)</Label>
        <Select id="accountId" name="accountId" defaultValue={defaults?.accountId ?? ""}>
          <option value="">Cualquier cuenta</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <Label htmlFor="monthlyAmount">Monto mensual</Label>
        <Input
          id="monthlyAmount"
          name="monthlyAmount"
          type="number"
          step="0.01"
          min="0.01"
          required
          defaultValue={defaults?.monthlyAmount}
        />
      </div>
      <div>
        <Label htmlFor="weeklyAmount">Límite semanal (opcional)</Label>
        <Input
          id="weeklyAmount"
          name="weeklyAmount"
          type="number"
          step="0.01"
          defaultValue={defaults?.weeklyAmount ?? undefined}
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
          Presupuesto activo
        </label>
      )}

      {state?.error && <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{state.error}</p>}

      <Button type="submit" disabled={pending} className="mt-1 w-full">
        {pending ? "Guardando…" : submitLabel}
      </Button>
    </form>
  );
}
