"use client";

import { useActionState } from "react";
import { Card } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { Dictionary } from "@/lib/i18n";
import { StepIndicator } from "./step-indicator";
import { completeSalaryStepAction, skipOnboardingAction, type ActionState } from "./actions";

const initialState: ActionState = undefined;

export function SalaryForm({ t }: { t: Dictionary }) {
  const [state, formAction, pending] = useActionState(completeSalaryStepAction, initialState);

  return (
    <Card className="p-6">
      <StepIndicator current={1} t={t} />
      <h1 className="font-display text-lg font-bold">{t.money.onboarding.salaryTitle}</h1>
      <p className="mt-1 text-sm text-ink-soft">{t.money.onboarding.salarySubtitle}</p>

      <form action={formAction} className="mt-6 flex flex-col gap-4">
        <div>
          <Label htmlFor="accountName">{t.money.onboarding.accountNameLabel}</Label>
          <Input id="accountName" name="accountName" required placeholder={t.money.accounts.namePlaceholder} />
        </div>
        <div>
          <Label htmlFor="salaryName">{t.money.onboarding.incomeNameLabel}</Label>
          <Input id="salaryName" name="salaryName" required placeholder={t.money.income.namePlaceholder} />
        </div>
        <div>
          <Label htmlFor="salaryAmount">{t.money.income.amountVariableHint}</Label>
          <Input id="salaryAmount" name="salaryAmount" type="number" step="0.01" />
        </div>
        <div>
          <Label htmlFor="salaryDay">{t.money.income.dayOfMonthLabel}</Label>
          <Input id="salaryDay" name="salaryDay" type="number" min="1" max="31" required defaultValue="1" />
        </div>

        {state?.error && <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{state.error}</p>}

        <Button type="submit" disabled={pending} className="mt-1 w-full">
          {pending ? t.common.saving : t.money.onboarding.continueSubmit}
        </Button>
        <form action={skipOnboardingAction}>
          <button type="submit" className="w-full text-center text-sm text-ink-faint hover:text-ink">
            {t.money.onboarding.skipMyself}
          </button>
        </form>
      </form>
    </Card>
  );
}
