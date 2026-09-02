"use server";

import { prisma } from "@/lib/db/prisma";
import { requireUserId } from "@/lib/auth/session";
import { searchFoods } from "@/lib/nutrition/food/search";

export async function searchFoodsAction(query: string) {
  await requireUserId();
  return searchFoods(query);
}

export interface CreateCustomFoodInput {
  name: string;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  fiberPer100g?: number;
}

export async function createCustomFood(input: CreateCustomFoodInput) {
  const userId = await requireUserId();

  if (!input.name.trim()) {
    throw new Error("El nombre es obligatorio.");
  }

  const macros = [
    input.caloriesPer100g,
    input.proteinPer100g,
    input.carbsPer100g,
    input.fatPer100g,
    input.fiberPer100g ?? 0,
  ];
  if (macros.some((v) => !Number.isFinite(v) || v < 0) || input.caloriesPer100g > 900) {
    throw new Error("Los valores nutricionales ingresados no son válidos.");
  }

  return prisma.foodItem.create({
    data: {
      name: input.name.trim(),
      caloriesPer100g: input.caloriesPer100g,
      proteinPer100g: input.proteinPer100g,
      carbsPer100g: input.carbsPer100g,
      fatPer100g: input.fatPer100g,
      fiberPer100g: input.fiberPer100g,
      source: "CUSTOM",
      userId,
    },
  });
}
