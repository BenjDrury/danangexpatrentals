#!/usr/bin/env node
/**
 * Run Supabase SQL setup (supabase/01, 02, 03) against your project's database.
 *
 * Requires in scripts/.secret.local or scripts/secrets:
 *   SUPABASE_DB_URI=postgresql://...
 *
 * Use the Connection pooling (Transaction) URI (port 6543, *.pooler.supabase.com), not the direct one (5432).
 */

import { config } from "dotenv";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));
const scriptsDir = join(__dirname, "..");
const repoRoot = join(scriptsDir, "..");

config({ path: join(scriptsDir, ".secret.local") });
config({ path: join(scriptsDir, "secrets") });

const uri = process.env.SUPABASE_DB_URI;
if (!uri) {
  console.error("Missing SUPABASE_DB_URI. Add it to scripts/.secret.local or scripts/secrets.");
  console.error("Get it from Supabase Dashboard → Settings → Database → Connection string → URI");
  process.exit(1);
}

const files = ["01-leads.sql", "02-areas-apartments.sql", "03-users.sql", "04-admin-rls.sql", "05-admin-write.sql", "06-admin-only-write.sql"];

async function main() {
  const client = new pg.Client({ connectionString: uri });
  try {
    await client.connect();
    console.log("Connected to Supabase DB.\n");

    for (const name of files) {
      const filePath = join(repoRoot, "supabase", name);
      const sql = readFileSync(filePath, "utf8");
      console.log("Running", name, "...");
      await client.query(sql);
      console.log("  OK\n");
    }

    console.log("Setup complete.");
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
