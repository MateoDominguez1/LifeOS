"use client";

import { useActionState } from "react";
import { Select } from "@/components/ui/select";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createFixedExpenseAction, type ActionState } from "../actions";

const initialState: ActionState = undefined;

export function FixedExpenseForm({
  accounts,
  categories,
}: {
  accounts: { id: string; name: string }[];
  categories: { id: string; name: string; icon: string }[];
}) {
  const [state, formAction, pending] = useActionState(createFixedExpenseAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="isActive" value="on" />
      <div>
        <Label htmlFor="name">Nombre</Label>
        <Input id="name" name="name" required placeholder="Ej. Alquiler" />
      </div>
      <div>
        <Label htmlFor="amount">Monto</Label>
        <Input id="amount" name="amount" type="number" step="0.01" min="0.01" required />
      </div>
      <div>
        <Label htmlFor="frequency">Frecuencia</Label>
        <Select id="frequency" name="frequency" defaultValue="MONTHLY">
          <option value="WEEKLY">Semanal</option>
          <option value="MONTHLY">Mensual</option>
          <option value="YEARLY">Anual</option>
        </Select>
      </div>
      <div>
        <Label htmlFor="dueDay">Día de vencimiento</Label>
        <Input id="dueDay" name="dueDay" type="number" min="0" max="31" required defaultValue="1" />
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
      <div>
        <Label htmlFor="categoryId">Categoría (opcional)</Label>
        <Select id="categoryId" name="categoryId" defaultValue="">
          <option value="">Sin categoría</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.icon} {c.name}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <Label htmlFor="startDate">Empieza</Label>
        <Input id="startDate" name="startDate" type="date" defaultValue={new Date().toISOString().slice(0, 10)} required />
      </div>

      {state?.error && <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{state.error}</p>}

      <Button type="submit" disabled={pending} className="mt-1 w-full">
        {pending ? "Creando…" : "Crear gasto fijo"}
      </Button>
    </form>
  );
}
