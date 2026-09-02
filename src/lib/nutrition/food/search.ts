import type { FoodItem } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";
import { mapUsdaFoodToNutrition, searchUsdaFoods } from "./usda";
import { getFatSecretFoodDetails, searchFatSecretFoods, type MappedFatSecretFood } from "./fatsecret";

const MIN_CACHED_RESULTS_TO_SKIP_API = 5;
const MAX_QUERY_LENGTH = 100;
const MAX_FATSECRET_DETAILS = 5;

async function searchFatSecret(query: string): Promise<MappedFatSecretFood[]> {
  const summaries = await searchFatSecretFoods(query, MAX_FATSECRET_DETAILS);
  const details = await Promise.all(
    summaries.map(async (s) => {
      try {
        return await getFatSecretFoodDetails(s.foodId);
      } catch (error) {
        console.error(`FatSecret food.get failed for ${s.foodId}:`, error);
        return null;
      }
    })
  );
  return details.filter((d): d is MappedFatSecretFood => d !== null);
}

export async function searchFoods(query: string): Promise<FoodItem[]> {
  const trimmed = query.trim().slice(0, MAX_QUERY_LENGTH);
  if (trimmed.length < 2) return [];

  const cached = await prisma.foodItem.findMany({
    where: { name: { contains: trimmed, mode: "insensitive" } },
    take: 20,
    orderBy: [{ isFrequent: "desc" }, { name: "asc" }],
  });

  if (cached.length >= MIN_CACHED_RESULTS_TO_SKIP_API) {
    return cached;
  }

  const [usdaFoods, fatSecretFoods] = await Promise.all([
    searchUsdaFoods(trimmed).catch((error) => {
      console.error("USDA search failed:", error);
      return [];
    }),
    searchFatSecret(trimmed).catch((error) => {
      console.error("FatSecret search failed:", error);
      return [];
    }),
  ]);
  const usdaResults = usdaFoods.map(mapUsdaFoodToNutrition);

  const existingFdcIds = new Set(cached.map((f) => f.usdaFdcId).filter(Boolean));
  const existingFatSecretIds = new Set(cached.map((f) => f.fatSecretId).filter(Boolean));

  const newUsda = usdaResults.filter((f) => !existingFdcIds.has(f.usdaFdcId));
  const newFatSecret = fatSecretFoods.filter((f) => !existingFatSecretIds.has(f.fatSecretId));

  const created = await Promise.all([
    ...newUsda.map((f) =>
      prisma.foodItem.upsert({
        where: { usdaFdcId: f.usdaFdcId },
        create: { ...f, source: "USDA" },
        update: {},
      })
    ),
    ...newFatSecret.map((f) =>
      prisma.foodItem.upsert({
        where: { fatSecretId: f.fatSecretId },
        create: { ...f, source: "FATSECRET" },
        update: {},
      })
    ),
  ]);

  return [...cached, ...created];
}
