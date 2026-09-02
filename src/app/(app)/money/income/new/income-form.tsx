"use client";

import { useActionState } from "react";
import { Select } from "@/components/ui/select";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createIncomeAction, type ActionState } from "../actions";

const initialState: ActionState = undefined;

export function IncomeForm({ accounts }: { accounts: { id: string; name: string }[] }) {
  const [state, formAction, pending] = useActionState(createIncomeAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="isActive" value="on" />
      <div>
        <Label htmlFor="name">Nombre</Label>
        <Input id="name" name="name" required placeholder="Ej. Sueldo" />
      </div>
      <div>
        <Label htmlFor="amount">Monto (dejalo vacío si es variable)</Label>
        <Input id="amount" name="amount" type="number" step="0.01" />
      </div>
      <div>
        <Label htmlFor="dayOfMonth">Día de cobro</Label>
        <Input id="dayOfMonth" name="dayOfMonth" type="number" min="1" max="31" required defaultValue="1" />
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

      {state?.error && <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{state.error}</p>}

      <Button type="submit" disabled={pending} className="mt-1 w-full">
        {pending ? "Creando…" : "Crear ingreso"}
      </Button>
    </form>
  );
}
