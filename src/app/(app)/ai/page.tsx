import { Sparkles } from "lucide-react";
import { ComingSoon } from "@/components/ui/coming-soon";

export default function AiPage() {
  return (
    <ComingSoon
      icon={Sparkles}
      title="LifeOS AI"
      phase="Fase 14 — LifeOS AI"
      description="El asistente cross-domain necesita que Money, Nutrition y Fitness ya tengan datos reales antes de poder responder algo útil."
    />
  );
}
