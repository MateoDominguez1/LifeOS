import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { requireUserId } from "@/lib/auth/session";
import { getT } from "@/lib/i18n";
import { OnboardingWizard } from "./OnboardingWizard";

export default async function FitnessOnboardingPage() {
  const [userId, { t }] = await Promise.all([requireUserId(), getT()]);

  const profile = await prisma.fitnessProfile.findUnique({ where: { userId } });
  if (profile) {
    redirect("/fitness");
  }

  const exercises = await prisma.exercise.findMany({ include: { category: true }, orderBy: { name: "asc" } });

  return <OnboardingWizard exercises={exercises} t={t} />;
}
