// Fase 7: migrates the GLOBAL exercise reference data (ExerciseCategory +
// Exercise) from GYM's backup — not user-scoped, so no target user id needed.
// Idempotent: matches existing categories/exercises by name.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "pg";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BACKUP_DIR = path.join(__dirname, "../../backups/fitness");
const MAP_PATH = path.join(__dirname, "migration-maps/fitness-exercises.json");

const parsed = dotenv.parse(fs.readFileSync(path.join(__dirname, "../../.env"), "utf8"));
const client = new Client({ connectionString: parsed.DATABASE_URL });

function load(name) {
  return JSON.parse(fs.readFileSync(path.join(BACKUP_DIR, `${name}.json`), "utf8"));
}

function newId(prefix) {
  return `${prefix}_${Math.random().toString(36).slice(2, 15)}`;
}

/** Postgres array literal `{A,B,C}` (returned as a raw string for enum[]
 * columns when pg has no registered type parser) -> JS string array. */
function parsePgArray(value) {
  if (Array.isArray(value)) return value;
  if (value == null) return [];
  const inner = value.replace(/^\{/, "").replace(/\}$/, "");
  return inner === "" ? [] : inner.split(",");
}

async function main() {
  await client.connect();

  const maps = fs.existsSync(MAP_PATH) ? JSON.parse(fs.readFileSync(MAP_PATH, "utf8")) : {};
  const categoryMap = (maps.ExerciseCategory ??= {});
  const exerciseMap = (maps.Exercise ??= {});

  const categories = load("ExerciseCategory");
  for (const cat of categories) {
    if (categoryMap[cat.id]) continue;
    const existing = await client.query(`SELECT id FROM "ExerciseCategory" WHERE name = $1`, [cat.name]);
    if (existing.rows[0]) {
      categoryMap[cat.id] = existing.rows[0].id;
      continue;
    }
    const id = newId("exc");
    await client.query(`INSERT INTO "ExerciseCategory" (id, name) VALUES ($1, $2)`, [id, cat.name]);
    categoryMap[cat.id] = id;
  }

  // Two rows named "Test Bench <timestamp>" are leftover artifacts from an
  // automated PersonConnection test run (categoryId null, unlike every real
  // seed exercise) — exclude them from the real exercise library.
  const exercises = load("Exercise").filter((e) => !e.name.startsWith("Test Bench "));
  let created = 0;
  for (const ex of exercises) {
    if (exerciseMap[ex.id]) continue;
    const existing = await client.query(`SELECT id FROM "Exercise" WHERE name = $1`, [ex.name]);
    if (existing.rows[0]) {
      exerciseMap[ex.id] = existing.rows[0].id;
      continue;
    }
    const id = newId("ex");
    await client.query(
      `INSERT INTO "Exercise" (id, name, "categoryId", "muscleGroups", equipment, "videoUrl", "defaultTempo", "isCustom", "createdByUserId", "createdAt")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [
        id,
        ex.name,
        ex.categoryId ? categoryMap[ex.categoryId] ?? null : null,
        parsePgArray(ex.muscleGroups),
        parsePgArray(ex.equipment),
        ex.videoUrl,
        ex.defaultTempo,
        ex.isCustom,
        null, // createdByUserId: all real exercises here are seed data (isCustom=false), not user-authored
        ex.createdAt,
      ]
    );
    exerciseMap[ex.id] = id;
    created++;
  }

  fs.mkdirSync(path.dirname(MAP_PATH), { recursive: true });
  fs.writeFileSync(MAP_PATH, JSON.stringify(maps, null, 2));

  console.log(JSON.stringify({ categories: { source: categories.length, mapped: Object.keys(categoryMap).length }, exercises: { source: exercises.length, created, mapped: Object.keys(exerciseMap).length } }, null, 2));

  await client.end();
}

main().catch(async (err) => {
  console.error(err);
  await client.end();
  process.exit(1);
});
