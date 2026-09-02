"use client";

import { useActionState } from "react";
import { Select } from "@/components/ui/select";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { ActionState } from "./actions";

const initialState: ActionState = undefined;

export function ImportantDateForm({
  action,
  defaults,
  submitLabel = "Agregar fecha",
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
}) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {!defaults && <input type="hidden" name="isActive" value="on" />}
      <div>
        <Label htmlFor="personName">Nombre</Label>
        <Input id="personName" name="personName" required placeholder="Ej. Mamá" defaultValue={defaults?.personName} />
      </div>
      <div>
        <Label htmlFor="relationship">Relación (opcional)</Label>
        <Input id="relationship" name="relationship" placeholder="Ej. Madre" defaultValue={defaults?.relationship} />
      </div>
      <div>
        <Label htmlFor="type">Tipo</Label>
        <Select id="type" name="type" defaultValue={defaults?.type ?? "BIRTHDAY"}>
          <option value="BIRTHDAY">Cumpleaños</option>
          <option value="ANNIVERSARY">Aniversario</option>
          <option value="OTHER">Otro</option>
        </Select>
      </div>
      <div>
        <Label htmlFor="date">Fecha</Label>
        <Input id="date" name="date" type="date" required defaultValue={defaults?.date} />
      </div>
      <div>
        <Label htmlFor="reminderDaysBefore">Avisarme con cuántos días de anticipación</Label>
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
        <Label htmlFor="note">Nota (opcional)</Label>
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
          Activa
        </label>
      )}

      {state?.error && <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{state.error}</p>}

      <Button type="submit" disabled={pending} className="mt-1 w-full">
        {pending ? "Guardando…" : submitLabel}
      </Button>
    </form>
  );
}
