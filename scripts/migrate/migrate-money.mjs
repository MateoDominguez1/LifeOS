// Fase 5 real data migration: Money (smart-monthly-budget) -> LifeOS.
// Reads the read-only JSON backup captured in Fase 3 (backups/money/*.json),
// never touches the source database. Idempotent: writes a legacyId -> newId
// map to migration-maps/money.json and upserts by that map on re-run.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "pg";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BACKUP_DIR = path.join(__dirname, "../../backups/money");
const MAP_PATH = path.join(__dirname, "migration-maps/money.json");

const NEW_USER_ID = process.argv[2];
if (!NEW_USER_ID) {
  console.error("Usage: node migrate-money.mjs <newUserId>");
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

function toBuffer(receiptData) {
  if (!receiptData) return null;
  if (receiptData.data) return Buffer.from(receiptData.data);
  if (receiptData.base64) return Buffer.from(receiptData.base64, "base64");
  return null;
}

async function main() {
  await client.connect();

  const maps = fs.existsSync(MAP_PATH) ? JSON.parse(fs.readFileSync(MAP_PATH, "utf8")) : {};
  const ensureMap = (name) => (maps[name] ??= {});
  const categoryMap = ensureMap("Category");
  const accountMap = ensureMap("Account");
  const fixedExpenseMap = ensureMap("FixedExpense");
  const incomeMap = ensureMap("Income");

  const summary = {};

  // ---- Categories: default ones map to LifeOS's already-seeded defaults by
  // name; only custom (userId != null) categories get new rows. ----
  const categories = load("Category");
  const existingDefaults = await client.query(
    `SELECT id, name FROM "Category" WHERE "isDefault" = true AND "userId" IS NULL`
  );
  const defaultByName = new Map(existingDefaults.rows.map((r) => [r.name, r.id]));

  let categoriesCreated = 0;
  for (const cat of categories) {
    if (categoryMap[cat.id]) continue;
    if (cat.userId === null) {
      const matched = defaultByName.get(cat.name);
      if (matched) {
        categoryMap[cat.id] = matched;
        continue;
      }
      // Default category with no name match in LifeOS — treat as custom so nothing is lost.
    }
    const id = newId("cat");
    await client.query(
      `INSERT INTO "Category" (id, "userId", name, icon, color, "isDefault", "createdAt")
       VALUES ($1,$2,$3,$4,$5,false,$6)`,
      [id, NEW_USER_ID, cat.name, cat.icon, cat.color, cat.createdAt]
    );
    categoryMap[cat.id] = id;
    categoriesCreated++;
  }
  summary.categories = { source: categories.length, created: categoriesCreated, matchedToDefaults: categories.length - categoriesCreated };

  // ---- Accounts ----
  const accounts = load("Account");
  for (const acc of accounts) {
    if (accountMap[acc.id]) continue;
    const id = newId("acc");
    await client.query(
      `INSERT INTO "Account" (id, "userId", name, type, balance, color, icon, "isActive", "excludeFromTotal", "createdAt", "updatedAt")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [id, NEW_USER_ID, acc.name, acc.type, acc.balance, acc.color, acc.icon, acc.isActive, acc.excludeFromTotal, acc.createdAt, acc.updatedAt]
    );
    accountMap[acc.id] = id;
  }
  summary.accounts = { source: accounts.length, created: Object.keys(accountMap).length };

  // ---- Fixed expenses ----
  const fixedExpenses = load("FixedExpense");
  for (const fe of fixedExpenses) {
    if (fixedExpenseMap[fe.id]) continue;
    const id = newId("fex");
    await client.query(
      `INSERT INTO "FixedExpense" (id, "userId", name, amount, "dueDay", "accountId", "categoryId", frequency, "startDate", "endDate", "isActive", "createdAt", "updatedAt")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
      [
        id,
        NEW_USER_ID,
        fe.name,
        fe.amount,
        fe.dueDay,
        accountMap[fe.accountId],
        fe.categoryId ? categoryMap[fe.categoryId] ?? null : null,
        fe.frequency,
        fe.startDate,
        fe.endDate,
        fe.isActive,
        fe.createdAt,
        fe.updatedAt,
      ]
    );
    fixedExpenseMap[fe.id] = id;
  }
  summary.fixedExpenses = { source: fixedExpenses.length, created: Object.keys(fixedExpenseMap).length };

  // ---- Income ----
  const incomes = load("Income");
  for (const inc of incomes) {
    if (incomeMap[inc.id]) continue;
    const id = newId("inc");
    await client.query(
      `INSERT INTO "Income" (id, "userId", name, amount, "accountId", "dayOfMonth", frequency, "isActive", "createdAt", "updatedAt")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [id, NEW_USER_ID, inc.name, inc.amount, accountMap[inc.accountId], inc.dayOfMonth, inc.frequency, inc.isActive, inc.createdAt, inc.updatedAt]
    );
    incomeMap[inc.id] = id;
  }
  summary.incomes = { source: incomes.length, created: Object.keys(incomeMap).length };

  // ---- Budgets ----
  const budgets = load("Budget");
  const budgetMap = ensureMap("Budget");
  for (const b of budgets) {
    if (budgetMap[b.id]) continue;
    const id = newId("bud");
    await client.query(
      `INSERT INTO "Budget" (id, "userId", name, type, "categoryId", "accountId", "monthlyAmount", "weeklyAmount", "weekStartDay", "isActive", "createdAt", "updatedAt")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
      [
        id,
        NEW_USER_ID,
        b.name,
        b.type,
        categoryMap[b.categoryId],
        b.accountId ? accountMap[b.accountId] ?? null : null,
        b.monthlyAmount,
        b.weeklyAmount,
        b.weekStartDay,
        b.isActive,
        b.createdAt,
        b.updatedAt,
      ]
    );
    budgetMap[b.id] = id;
  }
  summary.budgets = { source: budgets.length, created: Object.keys(budgetMap).length };

  // ---- Transactions ----
  const transactions = load("Transaction");
  const transactionMap = ensureMap("Transaction");
  let receiptsMigrated = 0;
  for (const tx of transactions) {
    if (transactionMap[tx.id]) continue;
    const id = newId("txn");
    const receiptBuf = toBuffer(tx.receiptData);
    if (receiptBuf) receiptsMigrated++;
    await client.query(
      `INSERT INTO "Transaction" (id, "userId", "accountId", "categoryId", type, amount, description, note, date, "fixedExpenseId", "incomeId", "receiptData", "receiptMimeType", "receiptFileName", "createdAt")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
      [
        id,
        NEW_USER_ID,
        accountMap[tx.accountId],
        tx.categoryId ? categoryMap[tx.categoryId] ?? null : null,
        tx.type,
        tx.amount,
        tx.description,
        tx.note,
        tx.date,
        tx.fixedExpenseId ? fixedExpenseMap[tx.fixedExpenseId] ?? null : null,
        tx.incomeId ? incomeMap[tx.incomeId] ?? null : null,
        receiptBuf,
        tx.receiptMimeType,
        tx.receiptFileName,
        tx.createdAt,
      ]
    );
    transactionMap[tx.id] = id;
  }
  summary.transactions = { source: transactions.length, created: Object.keys(transactionMap).length, receiptsMigrated };

  // ---- Important dates ----
  const importantDates = load("ImportantDate");
  const dateMap = ensureMap("ImportantDate");
  for (const d of importantDates) {
    if (dateMap[d.id]) continue;
    const id = newId("dat");
    await client.query(
      `INSERT INTO "ImportantDate" (id, "userId", "personName", relationship, type, date, note, "reminderDaysBefore", "isActive", "createdAt", "updatedAt")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [id, NEW_USER_ID, d.personName, d.relationship, d.type, d.date, d.note, d.reminderDaysBefore, d.isActive, d.createdAt, d.updatedAt]
    );
    dateMap[d.id] = id;
  }
  summary.importantDates = { source: importantDates.length, created: Object.keys(dateMap).length };

  // ---- API tokens (tokenHash preserved so any existing physical token, e.g. an iOS Shortcut, keeps working) ----
  const apiTokens = load("ApiToken");
  const tokenMap = ensureMap("ApiToken");
  for (const t of apiTokens) {
    if (tokenMap[t.id]) continue;
    const id = newId("tok");
    await client.query(
      `INSERT INTO "ApiToken" (id, "userId", name, "tokenHash", "lastUsedAt", "createdAt")
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [id, NEW_USER_ID, t.name, t.tokenHash, t.lastUsedAt, t.createdAt]
    );
    tokenMap[t.id] = id;
  }
  summary.apiTokens = { source: apiTokens.length, created: Object.keys(tokenMap).length };

  // ---- Push subscriptions (likely stale — tied to the old app's origin/service worker; harmless to carry over, self-cleans on first failed send) ----
  const pushSubs = load("PushSubscription");
  const pushMap = ensureMap("PushSubscription");
  for (const p of pushSubs) {
    if (pushMap[p.id]) continue;
    const id = newId("psh");
    await client.query(
      `INSERT INTO "PushSubscription" (id, "userId", endpoint, p256dh, auth, "createdAt")
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT (endpoint) DO NOTHING`,
      [id, NEW_USER_ID, p.endpoint, p.p256dh, p.auth, p.createdAt]
    );
    pushMap[p.id] = id;
  }
  summary.pushSubscriptions = { source: pushSubs.length, created: Object.keys(pushMap).length };

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
