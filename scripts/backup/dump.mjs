// Read-only logical backup: connects to one source Postgres database, dumps
// every table in the `public` schema to a JSON file, and prints row counts.
// Never writes to the source database. Intended to be run once per app
// before any migration work touches that app's data.
//
// Usage:
//   node dump.mjs --env <path-to-.env> --url-var DATABASE_URL --label money --out ../../backups

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "pg";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function parseArgs() {
  const args = process.argv.slice(2);
  const out = {};
  for (let i = 0; i < args.length; i += 2) {
    out[args[i].replace(/^--/, "")] = args[i + 1];
  }
  return out;
}

function jsonReplacer(_key, value) {
  if (Buffer.isBuffer(value)) {
    return { __type: "Buffer", base64: value.toString("base64") };
  }
  if (typeof value === "bigint") {
    return value.toString();
  }
  return value;
}

async function main() {
  const { env: envPath, "url-var": urlVar, label, out: outDir } = parseArgs();
  if (!envPath || !urlVar || !label || !outDir) {
    console.error("Missing required args: --env --url-var --label --out");
    process.exit(1);
  }

  const parsed = dotenv.parse(fs.readFileSync(envPath, "utf8"));
  const connectionString = parsed[urlVar];
  if (!connectionString) {
    console.error(`${urlVar} not found in ${envPath}`);
    process.exit(1);
  }

  const destDir = path.resolve(__dirname, outDir, label);
  fs.mkdirSync(destDir, { recursive: true });

  const client = new Client({ connectionString });
  await client.connect();

  try {
    const { rows: tables } = await client.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);

    const summary = { label, dumpedAt: new Date().toISOString(), tables: {} };

    for (const { table_name } of tables) {
      const { rows } = await client.query(`SELECT * FROM "${table_name}"`);
      fs.writeFileSync(
        path.join(destDir, `${table_name}.json`),
        JSON.stringify(rows, jsonReplacer, 2)
      );
      summary.tables[table_name] = rows.length;
    }

    fs.writeFileSync(
      path.join(destDir, "_summary.json"),
      JSON.stringify(summary, null, 2)
    );

    console.log(`\n${label} — dumped ${tables.length} tables to ${destDir}\n`);
    const nameWidth = Math.max(...Object.keys(summary.tables).map((n) => n.length), 10);
    for (const [name, count] of Object.entries(summary.tables)) {
      console.log(`  ${name.padEnd(nameWidth)}  ${count}`);
    }
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("Backup failed:", err.message);
  process.exit(1);
});
