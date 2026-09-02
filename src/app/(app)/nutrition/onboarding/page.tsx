import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { requireUserId } from "@/lib/auth/session";
import { OnboardingWizard } from "./OnboardingWizard";

export default async function NutritionOnboardingPage() {
  const userId = await requireUserId();

  const profile = await prisma.nutritionProfile.findUnique({ where: { userId } });
  if (profile) {
    redirect("/nutrition");
  }

  return <OnboardingWizard />;
}
