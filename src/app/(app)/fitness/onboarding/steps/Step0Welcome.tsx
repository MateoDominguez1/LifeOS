import { StepShell } from "@/components/fitness/form";

export function Step0Welcome() {
  return (
    <StepShell emoji="💪" title="Armemos tu plan de entrenamiento">
      <p className="text-sm text-ink-soft">
        Son 6 pasos cortos. Con esto generamos tu primer programa de entrenamiento — vas a poder
        ajustarlo cuando quieras desde Programa.
      </p>
    </StepShell>
  );
}
