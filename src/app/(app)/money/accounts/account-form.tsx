"use client";

import { useActionState } from "react";
import { Select } from "@/components/ui/select";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { ActionState } from "./actions";

const ACCOUNT_TYPES: { value: string; label: string }[] = [
  { value: "CHECKING", label: "Cuenta corriente" },
  { value: "SAVINGS", label: "Ahorro" },
  { value: "CASH", label: "Efectivo" },
  { value: "CARD", label: "Tarjeta" },
  { value: "OTHER", label: "Otra" },
];

const initialState: ActionState = undefined;

export function AccountForm({
  action,
  defaults,
  submitLabel = "Crear cuenta",
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  defaults?: {
    name: string;
    type: string;
    balance: number;
    excludeFromTotal: boolean;
  };
  submitLabel?: string;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div>
        <Label htmlFor="name">Nombre</Label>
        <Input id="name" name="name" required placeholder="Ej. Cuenta principal" defaultValue={defaults?.name} />
      </div>
      <div>
        <Label htmlFor="type">Tipo</Label>
        <Select id="type" name="type" defaultValue={defaults?.type ?? "CHECKING"}>
          {ACCOUNT_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <Label htmlFor="balance">Saldo{defaults ? "" : " inicial"}</Label>
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
        No sumar al disponible total (plata que no es mía)
      </label>

      {state?.error && (
        <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{state.error}</p>
      )}

      <Button type="submit" disabled={pending} className="mt-1 w-full">
        {pending ? "Guardando…" : submitLabel}
      </Button>
    </form>
  );
}
