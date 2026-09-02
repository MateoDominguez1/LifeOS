import { NutritionNav } from "@/components/nutrition/nutrition-nav";
import { FoodSearch } from "./FoodSearch";

export default function NutritionFoodsPage() {
  return (
    <div>
      <NutritionNav />
      <h1 className="mb-1 font-display text-2xl font-bold tracking-tight text-ink">Alimentos</h1>
      <p className="mb-6 text-sm text-ink-soft">Buscá en la base de datos nutricional o agregá un alimento propio.</p>
      <FoodSearch />
    </div>
  );
}
