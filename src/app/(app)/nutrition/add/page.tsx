import { getT } from "@/lib/i18n";
import { AddMealFlow } from "./AddMealFlow";

export default async function AddMealPage() {
  const { t } = await getT();
  return <AddMealFlow t={t} />;
}
