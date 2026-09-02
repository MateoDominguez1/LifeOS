import type { FoodItem } from "@/generated/prisma/client";
import { searchFoods } from "./search";

export async function matchFoodToDatabase(name: string): Promise<FoodItem | null> {
  const results = await searchFoods(name);
  return results[0] ?? null;
}
