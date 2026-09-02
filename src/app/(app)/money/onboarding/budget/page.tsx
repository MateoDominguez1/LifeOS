"use client";

import { useActionState } from "react";
import { Card } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StepIndicator } from "../step-indicator";
import { completeGroceryBudgetAction, skipOnboardingAction, type ActionState } from "../actions";

const initialState: ActionState = undefined;

export default function OnboardingBudgetPage() {
  const [state, formAction, pending] = useActionState(completeGroceryBudgetAction, initialState);

  return (
    <Card className="p-6">
      <StepIndicator current={3} />
      <h1 className="font-display text-lg font-bold">Presupuesto de supermercado</h1>
      <p className="mt-1 text-sm text-ink-soft">
        ¿Cuánto querés gastar por mes en supermercado? Después podés agregar más presupuestos desde Money.
      </p>

      <form action={formAction} className="mt-6 flex flex-col gap-4">
        <div>
          <Label htmlFor="monthlyAmount">Monto mensual</Label>
          <Input id="monthlyAmount" name="monthlyAmount" type="number" step="0.01" min="0.01" required />
        </div>

        {state?.error && <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{state.error}</p>}

        <Button type="submit" disabled={pending} className="mt-1 w-full">
          {pending ? "Guardando…" : "Terminar"}
        </Button>
        <form action={skipOnboardingAction}>
          <button type="submit" className="w-full text-center text-sm text-ink-faint hover:text-ink">
            Saltear y terminar
          </button>
        </form>
      </form>
    </Card>
  );
}
