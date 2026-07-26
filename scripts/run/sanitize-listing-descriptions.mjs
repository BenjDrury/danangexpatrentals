#!/usr/bin/env node
/**
 * Strip emails and phone numbers from all apartment descriptions in Supabase.
 *
 * Usage:
 *   node scripts/run/sanitize-listing-descriptions.mjs
 *   node scripts/run/sanitize-listing-descriptions.mjs --dry-run
 *
 * Requires: scripts/.secret.local with SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { createRequire } from "module";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const scriptsDir = join(__dirname, "..");
config({ path: join(scriptsDir, ".env") });
config({ path: join(scriptsDir, ".secret.local") });
config({ path: join(scriptsDir, "secrets") });

const require = createRequire(import.meta.url);
const { sanitizeListingDescription } = require(
  "../../types/dist/lib/sanitize-listing-description.js"
);

const dryRun = process.argv.includes("--dry-run");
const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error(
    "Missing SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) or SUPABASE_SERVICE_ROLE_KEY in scripts/.secret.local"
  );
  process.exit(1);
}

const supabase = createClient(url, key);

async function main() {
  let updated = 0;
  let scanned = 0;
  let from = 0;
  const pageSize = 200;

  for (;;) {
    const { data, error } = await supabase
      .from("apartments")
      .select("id, description")
      .not("description", "is", null)
      .order("id", { ascending: true })
      .range(from, from + pageSize - 1);

    if (error) {
      console.error("Failed to fetch apartments:", error.message);
      process.exit(1);
    }
    if (!data?.length) break;

    for (const row of data) {
      scanned += 1;
      const before = String(row.description ?? "");
      const after = sanitizeListingDescription(before);
      if (before === (after ?? "")) continue;

      updated += 1;
      console.log(
        `${dryRun ? "[dry-run] " : ""}${row.id}\n  - ${JSON.stringify(before).slice(0, 180)}\n  + ${JSON.stringify(after)}`
      );

      if (!dryRun) {
        const { error: updateError } = await supabase
          .from("apartments")
          .update({ description: after })
          .eq("id", row.id);
        if (updateError) {
          console.error(`Failed to update ${row.id}:`, updateError.message);
          process.exit(1);
        }
      }
    }

    if (data.length < pageSize) break;
    from += pageSize;
  }

  console.log(
    `\nDone. Scanned ${scanned} descriptions with text; ${updated} ${dryRun ? "would be updated" : "updated"}.`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
