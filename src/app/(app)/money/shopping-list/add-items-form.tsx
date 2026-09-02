"use client";

import { useActionState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { addItemsFromTextAction, type ActionState } from "./actions";

const initialState: ActionState = undefined;

export function AddItemsForm() {
  const [state, formAction, pending] = useActionState(addItemsFromTextAction, initialState);
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) ref.current?.reset();
  }, [state]);

  return (
    <form ref={ref} action={formAction} className="flex flex-col gap-3">
      <label className="text-sm font-medium text-ink-soft">
        Pegá la lista (una por línea, formato: Producto - precio)
        <textarea
          name="text"
          required
          rows={4}
          placeholder={"Leche - 1.20\nPan - 2.50"}
          className="mt-1.5 w-full rounded-xl border border-border bg-surface p-3 text-sm text-ink outline-none focus:border-accent"
        />
      </label>
      {state?.error && <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{state.error}</p>}
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Agregando…" : "Agregar a la lista"}
      </Button>
    </form>
  );
}
