"use client";

import { useActionState } from "react";
import { Card } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StepIndicator } from "./step-indicator";
import { completeSalaryStepAction, skipOnboardingAction, type ActionState } from "./actions";

const initialState: ActionState = undefined;

export default function OnboardingSalaryPage() {
  const [state, formAction, pending] = useActionState(completeSalaryStepAction, initialState);

  return (
    <Card className="p-6">
      <StepIndicator current={1} />
      <h1 className="font-display text-lg font-bold">Bienvenido a Money</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Configuremos lo básico: tu cuenta principal y cuándo cobrás — así calculamos tu ciclo financiero.
      </p>

      <form action={formAction} className="mt-6 flex flex-col gap-4">
        <div>
          <Label htmlFor="accountName">Nombre de tu cuenta principal</Label>
          <Input id="accountName" name="accountName" required placeholder="Ej. Cuenta principal" />
        </div>
        <div>
          <Label htmlFor="salaryName">Nombre de tu ingreso principal</Label>
          <Input id="salaryName" name="salaryName" required placeholder="Ej. Sueldo" />
        </div>
        <div>
          <Label htmlFor="salaryAmount">Monto (dejalo vacío si es variable)</Label>
          <Input id="salaryAmount" name="salaryAmount" type="number" step="0.01" />
        </div>
        <div>
          <Label htmlFor="salaryDay">Día de cobro</Label>
          <Input id="salaryDay" name="salaryDay" type="number" min="1" max="31" required defaultValue="1" />
        </div>

        {state?.error && <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{state.error}</p>}

        <Button type="submit" disabled={pending} className="mt-1 w-full">
          {pending ? "Guardando…" : "Continuar"}
        </Button>
        <form action={skipOnboardingAction}>
          <button type="submit" className="w-full text-center text-sm text-ink-faint hover:text-ink">
            Prefiero configurarlo yo mismo
          </button>
        </form>
      </form>
    </Card>
  );
}
