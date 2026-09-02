const USDA_BASE_URL = "https://api.nal.usda.gov/fdc/v1";

export interface UsdaFoodNutrient {
  nutrientId: number;
  nutrientName: string;
  nutrientNumber: string;
  unitName: string;
  value: number;
}

export interface UsdaSearchResultFood {
  fdcId: number;
  description: string;
  dataType: string;
  foodNutrients: UsdaFoodNutrient[];
  servingSize?: number;
  servingSizeUnit?: string;
}

interface UsdaSearchResponse {
  foods?: UsdaSearchResultFood[];
  totalHits?: number;
}

export async function searchUsdaFoods(query: string, pageSize = 15): Promise<UsdaSearchResultFood[]> {
  const apiKey = process.env.USDA_API_KEY;
  if (!apiKey) {
    throw new Error("USDA_API_KEY no está configurada.");
  }

  const url = new URL(`${USDA_BASE_URL}/foods/search`);
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("query", query);
  url.searchParams.set("pageSize", String(pageSize));
  url.searchParams.set("dataType", "Foundation,SR Legacy,Survey (FNDDS)");

  // The upstream gateway occasionally returns a bare nginx 400 for no
  // discernible reason (confirmed transient via direct probing — the exact
  // same request randomly succeeds or fails run to run), so retry a couple
  // times before giving up.
  let res = await fetch(url.toString(), { cache: "no-store" });
  for (let attempt = 0; !res.ok && attempt < 2; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, 400));
    res = await fetch(url.toString(), { cache: "no-store" });
  }
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`USDA API respondió ${res.status}: ${body.slice(0, 300)}`);
  }

  const data = (await res.json()) as UsdaSearchResponse;
  return data.foods ?? [];
}

const NUTRIENT_NAME_MAP = {
  protein: ["protein"],
  fat: ["total lipid (fat)"],
  carbs: ["carbohydrate, by difference"],
  fiber: ["fiber, total dietary"],
  sugar: ["total sugars", "sugars, total including nlea", "sugars, total"],
  sodium: ["sodium, na"],
} as const;

const KJ_PER_KCAL = 4.184;

function findNutrientValue(nutrients: UsdaFoodNutrient[], names: readonly string[], preferredUnit?: string): number | null {
  const lower = names.map((n) => n.toLowerCase());
  const candidates = nutrients.filter((n) => lower.includes(n.nutrientName.toLowerCase()));
  if (candidates.length === 0) return null;

  if (preferredUnit) {
    const exact = candidates.find((n) => n.unitName.toUpperCase() === preferredUnit.toUpperCase());
    if (exact) return exact.value;
  }

  return candidates[0].value;
}

/** Energy is sometimes only reported in kJ — same nutrient name, different unit. */
function findCalories(nutrients: UsdaFoodNutrient[]): number {
  const energyEntries = nutrients.filter((n) => n.nutrientName.toLowerCase() === "energy");
  const kcalEntry = energyEntries.find((n) => n.unitName.toUpperCase() === "KCAL");
  if (kcalEntry) return kcalEntry.value;

  const kjEntry = energyEntries.find((n) => n.unitName.toUpperCase() === "KJ");
  if (kjEntry) return Math.round(kjEntry.value / KJ_PER_KCAL);

  return 0;
}

export interface MappedFoodNutrition {
  name: string;
  usdaFdcId: string;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  fiberPer100g: number | null;
  sugarPer100g: number | null;
  sodiumPer100g: number | null;
  commonPortionGrams: number | null;
}

export function mapUsdaFoodToNutrition(food: UsdaSearchResultFood): MappedFoodNutrition {
  const n = food.foodNutrients;
  const protein = findNutrientValue(n, NUTRIENT_NAME_MAP.protein, "G") ?? 0;
  const carbs = findNutrientValue(n, NUTRIENT_NAME_MAP.carbs, "G") ?? 0;
  const fat = findNutrientValue(n, NUTRIENT_NAME_MAP.fat, "G") ?? 0;

  // USDA's search endpoint occasionally omits the Energy nutrient for a
  // food even though macros are present — fall back to Atwater general
  // factors rather than showing 0 kcal for a real food.
  const reportedCalories = findCalories(n);
  const caloriesPer100g = reportedCalories > 0 ? reportedCalories : Math.round(protein * 4 + carbs * 4 + fat * 9);

  return {
    name: food.description,
    usdaFdcId: String(food.fdcId),
    caloriesPer100g,
    proteinPer100g: protein,
    carbsPer100g: carbs,
    fatPer100g: fat,
    fiberPer100g: findNutrientValue(n, NUTRIENT_NAME_MAP.fiber, "G"),
    sugarPer100g: findNutrientValue(n, NUTRIENT_NAME_MAP.sugar, "G"),
    sodiumPer100g: findNutrientValue(n, NUTRIENT_NAME_MAP.sodium, "MG"),
    commonPortionGrams: food.servingSizeUnit?.toLowerCase() === "g" ? (food.servingSize ?? null) : null,
  };
}
