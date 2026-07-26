#!/usr/bin/env node
/**
 * Run a single supabase/*.sql file against SUPABASE_DB_URI.
 * Usage: node scripts/run/run-sql.mjs supabase/28-listing-terms-fees.sql
 */
import { config } from "dotenv";
import { readFileSync } from "fs";
import { dirname, join, resolve } from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));
const scriptsDir = join(__dirname, "..");
const repoRoot = join(scriptsDir, "..");

config({ path: join(scriptsDir, ".env") });
config({ path: join(scriptsDir, ".secret.local") });

const uri = process.env.SUPABASE_DB_URI;
const rel = process.argv[2];
if (!uri) {
  console.error("Missing SUPABASE_DB_URI in scripts/.secret.local");
  process.exit(1);
}
if (!rel) {
  console.error("Usage: node scripts/run/run-sql.mjs supabase/<file>.sql");
  process.exit(1);
}

const filePath = resolve(repoRoot, rel);
const sql = readFileSync(filePath, "utf8");
const client = new pg.Client({
  connectionString: uri,
  ssl: { rejectUnauthorized: false },
});

try {
  await client.connect();
  console.log("Connected. Running", rel, "...");
  await client.query(sql);
  console.log("OK");
} catch (err) {
  console.error("Error:", err.message);
  process.exit(1);
} finally {
  await client.end();
}
