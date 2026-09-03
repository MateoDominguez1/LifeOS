import { getT } from "@/lib/i18n";
import { SalaryForm } from "./salary-form";

export default async function OnboardingSalaryPage() {
  const { t } = await getT();
  return <SalaryForm t={t} />;
}
