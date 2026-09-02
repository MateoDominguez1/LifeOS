// Fase 7 real data migration: Fitness (GYM) -> LifeOS.
// Reads the read-only JSON backup (backups/fitness/*.json), never touches
// the source database. Idempotent: writes a legacyId -> newId map to
// migration-maps/fitness.json and upserts by that map on re-run.
//
// Only migrates data owned by the real user (userId argv[2], the "Mateo
// Test" row in GYM) — the other 5 User rows in the source DB are confirmed
// test/seed accounts from automated PersonConnection testing and are
// excluded entirely, along with PersonConnection/ConnectionPermission/
// Notification rows tied to that test scenario (superseded by ManagedProfile
// per the approved design). Run migrate-fitness-exercises.mjs FIRST — this
// script assumes the global Exercise/ExerciseCategory reference data and
// migration-maps/fitness-exercises.json already exist.
//
// BodyProfile is deliberately NOT touched here: the user confirmed
// Nutrition's real values (23yo, 191cm) are correct over Fitness's
// (28yo, 178cm) — see lifeos_migration_project memory.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "pg";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BACKUP_DIR = path.join(__dirname, "../../backups/fitness");
const MAP_PATH = path.join(__dirname, "migration-maps/fitness.json");
const EXERCISE_MAP_PATH = path.join(__dirname, "migration-maps/fitness-exercises.json");

const NEW_USER_ID = process.argv[2];
const LEGACY_USER_ID = "cmtheukkw000088ftdy11a1sl"; // "Mateo Test" — confirmed the only real account in GYM's source DB
if (!NEW_USER_ID) {
  console.error("Usage: node migrate-fitness.mjs <newUserId>");
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

function parsePgArray(value) {
  if (Array.isArray(value)) return value;
  if (value == null) return [];
  const inner = value.replace(/^\{/, "").replace(/\}$/, "");
  return inner === "" ? [] : inner.split(",");
}

async function main() {
  await client.connect();

  const exerciseMaps = JSON.parse(fs.readFileSync(EXERCISE_MAP_PATH, "utf8"));
  const exerciseIdMap = exerciseMaps.Exercise;

  const maps = fs.existsSync(MAP_PATH) ? JSON.parse(fs.readFileSync(MAP_PATH, "utf8")) : {};
  const ensureMap = (name) => (maps[name] ??= {});
  const weightMap = ensureMap("WeightEntry");
  const measurementMap = ensureMap("BodyMeasurement");
  const programMap = ensureMap("WorkoutProgram");
  const dayMap = ensureMap("WorkoutDay");
  const workoutExerciseMap = ensureMap("WorkoutExercise");
  const sessionMap = ensureMap("WorkoutSession");
  const setMap = ensureMap("WorkoutSet");
  const prMap = ensureMap("PersonalRecord");

  const summary = {};

  // ---- FitnessProfile (age/sex/height intentionally excluded — BodyProfile
  // already holds the confirmed-correct values from Nutrition). ----
  const profiles = load("UserProfile");
  const profile = profiles.find((p) => p.userId === LEGACY_USER_ID);
  if (profile) {
    const fields = {
      level: profile.level,
      primaryGoal: profile.primaryGoal,
      secondaryGoals: parsePgArray(profile.secondaryGoals),
      daysPerWeek: profile.daysPerWeek,
      trainingDays: profile.trainingDays,
      sessionDurationMin: profile.sessionDurationMin,
      equipment: parsePgArray(profile.equipment),
      favoriteExerciseIds: profile.favoriteExerciseIds,
      excludedExerciseIds: profile.excludedExerciseIds,
      priorityMuscles: profile.priorityMuscles,
      cardioPreference: profile.cardioPreference,
      limitations: profile.limitations,
      rirRpeMode: profile.rirRpeMode,
      unitPreference: profile.unitPreference,
      onboardingCompletedAt: profile.onboardingCompletedAt,
      updatedAt: profile.updatedAt,
    };
    await client.query(
      `INSERT INTO "FitnessProfile"
         ("userId", level, "primaryGoal", "secondaryGoals", "daysPerWeek", "trainingDays", "sessionDurationMin",
          equipment, "favoriteExerciseIds", "excludedExerciseIds", "priorityMuscles", "cardioPreference",
          limitations, "rirRpeMode", "unitPreference", "onboardingCompletedAt", "updatedAt")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
       ON CONFLICT ("userId") DO UPDATE SET
         level=$2, "primaryGoal"=$3, "secondaryGoals"=$4, "daysPerWeek"=$5, "trainingDays"=$6, "sessionDurationMin"=$7,
         equipment=$8, "favoriteExerciseIds"=$9, "excludedExerciseIds"=$10, "priorityMuscles"=$11, "cardioPreference"=$12,
         limitations=$13, "rirRpeMode"=$14, "unitPreference"=$15, "onboardingCompletedAt"=$16, "updatedAt"=$17`,
      [
        NEW_USER_ID,
        fields.level,
        fields.primaryGoal,
        fields.secondaryGoals,
        fields.daysPerWeek,
        fields.trainingDays,
        fields.sessionDurationMin,
        fields.equipment,
        fields.favoriteExerciseIds,
        fields.excludedExerciseIds,
        fields.priorityMuscles,
        fields.cardioPreference,
        fields.limitations,
        fields.rirRpeMode,
        fields.unitPreference,
        fields.onboardingCompletedAt,
        fields.updatedAt,
      ]
    );

    if (profile.weightGoalKg != null) {
      const existingGoal = await client.query(
        `SELECT id FROM "Goal" WHERE "userId"=$1 AND domain='BODY' AND metric='BODY_WEIGHT' AND status='ACTIVE'`,
        [NEW_USER_ID]
      );
      if (existingGoal.rows[0]) {
        await client.query(`UPDATE "Goal" SET "targetValue"=$1 WHERE id=$2`, [profile.weightGoalKg, existingGoal.rows[0].id]);
      } else {
        await client.query(
          `INSERT INTO "Goal" (id, "userId", domain, metric, label, "targetValue", "currentValue", status, "createdAt", "updatedAt")
           VALUES ($1,$2,'BODY','BODY_WEIGHT',$3,$4,$5,'ACTIVE',$6,$6)`,
          [newId("goal"), NEW_USER_ID, `Peso objetivo: ${profile.weightGoalKg} kg`, profile.weightGoalKg, profile.weightKg, profile.updatedAt]
        );
      }
    }
  }
  summary.fitnessProfile = profile ? "migrated" : "none in source";

  // ---- WeightEntry (real rows only) ----
  const weightEntries = load("WeightEntry").filter((w) => w.userId === LEGACY_USER_ID);
  for (const w of weightEntries) {
    if (weightMap[w.id]) continue;
    const id = newId("wgt");
    await client.query(`INSERT INTO "WeightEntry" (id, "userId", "weightKg", "loggedAt", note) VALUES ($1,$2,$3,$4,$5)`, [
      id,
      NEW_USER_ID,
      w.weightKg,
      w.loggedAt,
      w.note,
    ]);
    weightMap[w.id] = id;
  }
  summary.weightEntries = { source: weightEntries.length, created: Object.keys(weightMap).length };

  // ---- BodyMeasurement (real rows only) ----
  const measurements = load("BodyMeasurement").filter((m) => m.userId === LEGACY_USER_ID);
  for (const m of measurements) {
    if (measurementMap[m.id]) continue;
    const id = newId("meas");
    await client.query(
      `INSERT INTO "BodyMeasurement" (id, "userId", type, "customLabel", "valueCm", "loggedAt") VALUES ($1,$2,$3,$4,$5,$6)`,
      [id, NEW_USER_ID, m.type, m.customLabel, m.valueCm, m.loggedAt]
    );
    measurementMap[m.id] = id;
  }
  summary.bodyMeasurements = { source: measurements.length, created: Object.keys(measurementMap).length };

  // ---- WorkoutProgram + WorkoutDay + WorkoutExercise (real only) ----
  const programs = load("WorkoutProgram").filter((p) => p.userId === LEGACY_USER_ID);
  for (const p of programs) {
    if (programMap[p.id]) continue;
    const id = newId("prog");
    await client.query(
      `INSERT INTO "WorkoutProgram" (id, "userId", name, active, source, "createdAt", "updatedAt") VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [id, NEW_USER_ID, p.name, p.active, p.source, p.createdAt, p.updatedAt]
    );
    programMap[p.id] = id;
  }

  const allDays = load("WorkoutDay");
  const days = allDays.filter((d) => programMap[d.programId]);
  for (const d of days) {
    if (dayMap[d.id]) continue;
    const id = newId("day");
    await client.query(`INSERT INTO "WorkoutDay" (id, "programId", "dayOfWeek", label, "order") VALUES ($1,$2,$3,$4,$5)`, [
      id,
      programMap[d.programId],
      d.dayOfWeek,
      d.label,
      d.order,
    ]);
    dayMap[d.id] = id;
  }

  const allWorkoutExercises = load("WorkoutExercise");
  const workoutExercises = allWorkoutExercises.filter((we) => dayMap[we.workoutDayId]);
  for (const we of workoutExercises) {
    if (workoutExerciseMap[we.id]) continue;
    const id = newId("wex");
    await client.query(
      `INSERT INTO "WorkoutExercise"
         (id, "workoutDayId", "exerciseId", "order", "targetSets", "targetRepsMin", "targetRepsMax", "targetWeightKg", "restSeconds", tempo, "targetRir", "targetRpe", "removedAt")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
      [
        id,
        dayMap[we.workoutDayId],
        exerciseIdMap[we.exerciseId],
        we.order,
        we.targetSets,
        we.targetRepsMin,
        we.targetRepsMax,
        we.targetWeightKg,
        we.restSeconds,
        we.tempo,
        we.targetRir,
        we.targetRpe,
        we.removedAt,
      ]
    );
    workoutExerciseMap[we.id] = id;
  }
  summary.workoutPrograms = { source: programs.length, created: Object.keys(programMap).length };
  summary.workoutDays = { source: days.length, created: Object.keys(dayMap).length };
  summary.workoutExercises = { source: workoutExercises.length, created: Object.keys(workoutExerciseMap).length };

  // ---- WorkoutSession + WorkoutSet (real only) ----
  const sessions = load("WorkoutSession").filter((s) => s.userId === LEGACY_USER_ID);
  for (const s of sessions) {
    if (sessionMap[s.id]) continue;
    const id = newId("wses");
    await client.query(
      `INSERT INTO "WorkoutSession" (id, "userId", "workoutDayId", "startedAt", "completedAt", "durationSec", notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [id, NEW_USER_ID, s.workoutDayId ? dayMap[s.workoutDayId] ?? null : null, s.startedAt, s.completedAt, s.durationSec, s.notes]
    );
    sessionMap[s.id] = id;
  }

  const allSets = load("WorkoutSet");
  const sets = allSets.filter((set) => sessionMap[set.sessionId]);
  for (const set of sets) {
    if (setMap[set.id]) continue;
    const id = newId("wset");
    await client.query(
      `INSERT INTO "WorkoutSet" (id, "sessionId", "workoutExerciseId", "setNumber", "weightKg", reps, rir, rpe, completed, notes, "createdAt")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [
        id,
        sessionMap[set.sessionId],
        workoutExerciseMap[set.workoutExerciseId],
        set.setNumber,
        set.weightKg,
        set.reps,
        set.rir,
        set.rpe,
        set.completed,
        set.notes,
        set.createdAt,
      ]
    );
    setMap[set.id] = id;
  }
  summary.workoutSessions = { source: sessions.length, created: Object.keys(sessionMap).length };
  summary.workoutSets = { source: sets.length, created: Object.keys(setMap).length };

  // ---- PersonalRecord (real only) ----
  const records = load("PersonalRecord").filter((r) => r.userId === LEGACY_USER_ID);
  for (const r of records) {
    if (prMap[r.id]) continue;
    const id = newId("pr");
    await client.query(
      `INSERT INTO "PersonalRecord" (id, "userId", "exerciseId", type, value, "achievedAt", "sessionId") VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [id, NEW_USER_ID, exerciseIdMap[r.exerciseId], r.type, r.value, r.achievedAt, r.sessionId ? sessionMap[r.sessionId] ?? null : null]
    );
    prMap[r.id] = id;
  }
  summary.personalRecords = { source: records.length, created: Object.keys(prMap).length };

  // PersonConnection / ConnectionPermission / Notification / ProgressPhoto /
  // AIRecommendation are intentionally NOT migrated: all real-account rows in
  // those tables are 0 (or, for PersonConnection/Notification, tied entirely
  // to the confirmed test/seed "Girlfriend Test" scenario being superseded
  // by ManagedProfile).

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
