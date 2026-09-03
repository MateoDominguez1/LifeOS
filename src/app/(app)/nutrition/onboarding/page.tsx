import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { requireUserId } from "@/lib/auth/session";
import { getT } from "@/lib/i18n";
import { OnboardingWizard } from "./OnboardingWizard";

export default async function NutritionOnboardingPage() {
  const [userId, { t }] = await Promise.all([requireUserId(), getT()]);

  const profile = await prisma.nutritionProfile.findUnique({ where: { userId } });
  if (profile) {
    redirect("/nutrition");
  }

  return <OnboardingWizard t={t} />;
}
