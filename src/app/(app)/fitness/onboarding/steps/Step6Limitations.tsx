import type { OnboardingData } from "../types";
import { Field, StepShell } from "@/components/fitness/form";

export function Step6Limitations({ data, update }: { data: OnboardingData; update: (patch: Partial<OnboardingData>) => void }) {
  return (
    <StepShell title="¿Algo que evitar?" subtitle="Lesiones, molestias o movimientos que preferís no hacer.">
      <Field label="Limitaciones — opcional">
        <textarea
          rows={4}
          placeholder="Ej: lumbar sensible, evitar press por encima de la cabeza..."
          value={data.limitations}
          onChange={(e) => update({ limitations: e.target.value })}
          className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint outline-none transition-colors focus:border-fitness"
        />
      </Field>
    </StepShell>
  );
}
