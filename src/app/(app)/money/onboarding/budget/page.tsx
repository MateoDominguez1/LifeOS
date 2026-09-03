import { getT } from "@/lib/i18n";
import { GroceryBudgetForm } from "./grocery-budget-form";

export default async function OnboardingBudgetPage() {
  const { t } = await getT();
  return <GroceryBudgetForm t={t} />;
}
