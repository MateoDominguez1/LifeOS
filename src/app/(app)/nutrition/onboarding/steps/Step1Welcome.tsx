import { StepShell } from "@/components/nutrition/form";

export function Step1Welcome() {
  return (
    <StepShell emoji="👋" title="Vamos a configurar tu objetivo">
      <p className="text-sm text-ink-soft">
        Son 8 pasos cortos. Con esto calculamos tus calorías y macros
        objetivo del día — vas a poder ajustarlos manualmente cuando
        quieras desde tu perfil.
      </p>
    </StepShell>
  );
}
