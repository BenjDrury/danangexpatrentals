#!/usr/bin/env node
/**
 * Make a user an admin by inserting into public.profiles.
 * Usage: node make-admin.mjs <user-uuid>
 *
 * Loads env from scripts/.secret.local or scripts/secrets (parent of run/).
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const scriptsDir = join(__dirname, "..");
config({ path: join(scriptsDir, ".env") });
config({ path: join(scriptsDir, ".secret.local") });
config({ path: join(scriptsDir, "secrets") });

const uuid = process.argv[2];
if (!uuid) {
  console.error("Usage: node make-admin.mjs <user-uuid>");
  console.error("Get the UUID from Supabase → Authentication → Users → click user.");
  process.exit(1);
}

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) or SUPABASE_SERVICE_ROLE_KEY. Add them to scripts/.secret.local or scripts/secrets");
  process.exit(1);
}

const supabase = createClient(url, key);

const { data, error } = await supabase
  .from("profiles")
  .upsert({ id: uuid, role: "admin" }, { onConflict: "id" })
  .select()
  .single();

if (error) {
  console.error("Error:", error.message);
  process.exit(1);
}

console.log("Done. User", uuid, "is now an admin.");
if (data) console.log("Profile:", data);
