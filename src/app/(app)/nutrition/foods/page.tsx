import { NutritionNav } from "@/components/nutrition/nutrition-nav";
import { getT } from "@/lib/i18n";
import { FoodSearch } from "./FoodSearch";

export default async function NutritionFoodsPage() {
  const { t } = await getT();
  return (
    <div>
      <NutritionNav />
      <h1 className="mb-1 font-display text-2xl font-bold tracking-tight text-ink">{t.nutrition.foods.title}</h1>
      <p className="mb-6 text-sm text-ink-soft">{t.nutrition.foods.subtitle}</p>
      <FoodSearch t={t} />
    </div>
  );
}
