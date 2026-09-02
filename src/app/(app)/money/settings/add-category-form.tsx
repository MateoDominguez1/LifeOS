"use client";

import { useActionState } from "react";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createCategoryAction, type ActionState } from "./actions";

const initialState: ActionState = undefined;

export function AddCategoryForm() {
  const [state, formAction, pending] = useActionState(createCategoryAction, initialState);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2">
      <div className="w-16">
        <Label htmlFor="icon">Emoji</Label>
        <Input id="icon" name="icon" maxLength={4} defaultValue="🏷️" className="text-center" />
      </div>
      <div className="min-w-[160px] flex-1">
        <Label htmlFor="name">Nombre</Label>
        <Input id="name" name="name" required placeholder="Nueva categoría" />
      </div>
      <div>
        <Label htmlFor="color">Color</Label>
        <input
          id="color"
          name="color"
          type="color"
          defaultValue="#5b5bf6"
          className="h-11 w-16 rounded-xl border border-border bg-surface"
        />
      </div>
      <Button type="submit" variant="secondary" disabled={pending}>
        {pending ? "Agregando…" : "Agregar"}
      </Button>
      {state?.error && <p className="w-full text-sm text-danger">{state.error}</p>}
    </form>
  );
}
