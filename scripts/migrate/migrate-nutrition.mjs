// Fase 6 real data migration: Nutrition (Clorias) -> LifeOS.
// Reads the read-only JSON backup (backups/nutrition/*.json), never touches
// the source database. Idempotent: writes a legacyId -> newId map to
// migration-maps/nutrition.json and upserts by that map on re-run.
//
// Schema-split adaptation: Clorias' single UserProfile (age/sex/height/weight
// /goals all together) maps onto LifeOS's BodyProfile + WeightEntry +
// NutritionProfile + Goal(BODY,BODY_WEIGHT) — see lifeos_migration_project
// memory for why. FoodItem rows are global USDA cache entries (no userId in
// the source data), so they're upserted by usdaFdcId regardless of target user.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "pg";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BACKUP_DIR = path.join(__dirname, "../../backups/nutrition");
const MAP_PATH = path.join(__dirname, "migration-maps/nutrition.json");

const NEW_USER_ID = process.argv[2];
if (!NEW_USER_ID) {
  console.error("Usage: node migrate-nutrition.mjs <newUserId>");
  process.exit(1);
}

const parsed = dotenv.parse(fs.readFileSync(path.join(__dirname, "../../.env"), "utf8"));
const client = new Client({ connectionString: parsed.DATABASE_URL });

function load(name) {
  return JSON.parse(fs.readFileSync(path.join(BACKUP_DIR, `${name}.json`), "utf8"));
}

function newId(prefix) {
  return `${prefix}_${Math.random().toString(36).slice(2, 15)}`;
}

async function main() {
  await client.connect();

  const maps = fs.existsSync(MAP_PATH) ? JSON.parse(fs.readFileSync(MAP_PATH, "utf8")) : {};
  const ensureMap = (name) => (maps[name] ??= {});
  const weightEntryMap = ensureMap("WeightEntry");
  const goalMap = ensureMap("Goal");
  const foodItemMap = ensureMap("FoodItem");

  const summary = {};

  // ---- BodyProfile + NutritionProfile + WeightEntry + weight Goal, all
  // derived from Clorias' single UserProfile row. ----
  const profiles = load("UserProfile");
  const profile = profiles[0] ?? null;

  if (profile) {
    await client.query(
      `INSERT INTO "BodyProfile" ("userId", age, sex, "heightCm", "updatedAt")
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT ("userId") DO UPDATE SET age = $2, sex = $3, "heightCm" = $4, "updatedAt" = $5`,
      [NEW_USER_ID, profile.age, profile.sex, profile.heightCm, profile.updatedAt]
    );

    await client.query(
      `INSERT INTO "NutritionProfile"
         ("userId", "activityLevel", "isSedentaryJob", "trainingDaysPerWeek", "trainingDurationMin",
          "otherSports", "goalType", "goalRateKgPerWeek", "goalTargetDate", "mealsPerDay",
          "dietaryPreference", allergies, "dietType", "favoriteFoods", "limitedFoods",
          "autoRecalculateGoals", "updatedAt")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
       ON CONFLICT ("userId") DO UPDATE SET
         "activityLevel" = $2, "isSedentaryJob" = $3, "trainingDaysPerWeek" = $4, "trainingDurationMin" = $5,
         "otherSports" = $6, "goalType" = $7, "goalRateKgPerWeek" = $8, "goalTargetDate" = $9, "mealsPerDay" = $10,
         "dietaryPreference" = $11, allergies = $12, "dietType" = $13, "favoriteFoods" = $14, "limitedFoods" = $15,
         "autoRecalculateGoals" = $16, "updatedAt" = $17`,
      [
        NEW_USER_ID,
        profile.activityLevel,
        profile.isSedentaryJob,
        profile.trainingDaysPerWeek,
        profile.trainingDurationMin,
        profile.otherSports,
        profile.goalType,
        profile.goalRateKgPerWeek,
        profile.goalTargetDate,
        profile.mealsPerDay,
        profile.dietaryPreference,
        profile.allergies,
        profile.dietType,
        profile.favoriteFoods,
        profile.limitedFoods,
        profile.autoRecalculateGoals,
        profile.updatedAt,
      ]
    );

    if (!weightEntryMap[profile.id] && profile.weightKg != null) {
      const id = newId("wgt");
      await client.query(
        `INSERT INTO "WeightEntry" (id, "userId", "weightKg", "loggedAt", note)
         VALUES ($1,$2,$3,$4,$5)`,
        [id, NEW_USER_ID, profile.weightKg, profile.updatedAt, "Migrado desde Clorias"]
      );
      weightEntryMap[profile.id] = id;
    }

    if (!goalMap[profile.id] && profile.weightGoalKg != null) {
      const id = newId("goal");
      await client.query(
        `INSERT INTO "Goal" (id, "userId", domain, metric, label, "targetValue", "currentValue", status, "createdAt", "updatedAt")
         VALUES ($1,$2,'BODY','BODY_WEIGHT',$3,$4,$5,'ACTIVE',$6,$6)`,
        [id, NEW_USER_ID, `Peso objetivo: ${profile.weightGoalKg} kg`, profile.weightGoalKg, profile.weightKg, profile.updatedAt]
      );
      goalMap[profile.id] = id;
    }
  }
  summary.bodyAndNutritionProfile = profile ? "migrated" : "none in source";
  summary.weightEntry = { source: profile?.weightKg != null ? 1 : 0, created: Object.keys(weightEntryMap).length };
  summary.weightGoal = { source: profile?.weightGoalKg != null ? 1 : 0, created: Object.keys(goalMap).length };

  // ---- NutritionGoals (direct 1:1 copy — trackWater/trackSugar already
  // exist in both source and target after the schema-gap fix). ----
  const goalsRows = load("NutritionGoals");
  const goals = goalsRows[0] ?? null;
  if (goals) {
    await client.query(
      `INSERT INTO "NutritionGoals"
         ("userId", calories, protein, carbs, fat, fiber, water, sugar,
          "trackCalories", "trackProtein", "trackCarbs", "trackFat", "trackFiber", "trackWater", "trackSugar",
          "trackMicronutrients", "isManualOverride", "updatedAt")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
       ON CONFLICT ("userId") DO UPDATE SET
         calories=$2, protein=$3, carbs=$4, fat=$5, fiber=$6, water=$7, sugar=$8,
         "trackCalories"=$9, "trackProtein"=$10, "trackCarbs"=$11, "trackFat"=$12, "trackFiber"=$13,
         "trackWater"=$14, "trackSugar"=$15, "trackMicronutrients"=$16, "isManualOverride"=$17, "updatedAt"=$18`,
      [
        NEW_USER_ID,
        goals.calories,
        goals.protein,
        goals.carbs,
        goals.fat,
        goals.fiber,
        goals.water,
        goals.sugar,
        goals.trackCalories,
        goals.trackProtein,
        goals.trackCarbs,
        goals.trackFat,
        goals.trackFiber,
        goals.trackWater,
        goals.trackSugar,
        goals.trackMicronutrients,
        goals.isManualOverride,
        goals.updatedAt,
      ]
    );
  }
  summary.nutritionGoals = goals ? "migrated" : "none in source";

  // ---- FoodItem: global USDA cache entries, upsert by usdaFdcId. ----
  const foods = load("FoodItem");
  let foodsCreated = 0;
  for (const f of foods) {
    if (foodItemMap[f.id]) continue;
    if (f.usdaFdcId) {
      const existing = await client.query(`SELECT id FROM "FoodItem" WHERE "usdaFdcId" = $1`, [f.usdaFdcId]);
      if (existing.rows[0]) {
        foodItemMap[f.id] = existing.rows[0].id;
        continue;
      }
    }
    const id = newId("food");
    await client.query(
      `INSERT INTO "FoodItem"
         (id, name, source, "usdaFdcId", "caloriesPer100g", "proteinPer100g", "carbsPer100g", "fatPer100g",
          "fiberPer100g", "sugarPer100g", "sodiumPer100g", "commonPortionGrams", "isFrequent", "userId", "createdAt")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
       ON CONFLICT ("usdaFdcId") DO NOTHING`,
      [
        id,
        f.name,
        f.source,
        f.usdaFdcId,
        f.caloriesPer100g,
        f.proteinPer100g,
        f.carbsPer100g,
        f.fatPer100g,
        f.fiberPer100g,
        f.sugarPer100g,
        f.sodiumPer100g,
        f.commonPortionGrams,
        f.isFrequent,
        f.source === "CUSTOM" ? NEW_USER_ID : null,
        f.createdAt,
      ]
    );
    foodItemMap[f.id] = id;
    foodsCreated++;
  }
  summary.foodItems = { source: foods.length, created: foodsCreated, matchedExisting: foods.length - foodsCreated };

  // Meal / MealFood / WaterEntry / Recipe / RecipeIngredient / DailySummary
  // are all empty in the real source data (nothing logged yet in Clorias) —
  // nothing to migrate. UserPreference is intentionally NOT migrated: it's a
  // shared cross-domain table in LifeOS and Nutrition's onboarding gate is
  // "does NutritionProfile exist", independent of it.
  const emptyTables = ["Meal", "MealFood", "WaterEntry", "Recipe", "RecipeIngredient", "DailySummary"];
  for (const t of emptyTables) {
    summary[t] = { source: load(t).length, created: 0, note: "empty in source, nothing to migrate" };
  }

  fs.mkdirSync(path.dirname(MAP_PATH), { recursive: true });
  fs.writeFileSync(MAP_PATH, JSON.stringify(maps, null, 2));

  console.log(JSON.stringify(summary, null, 2));

  await client.end();
}

main().catch(async (err) => {
  console.error(err);
  await client.end();
  process.exit(1);
});
