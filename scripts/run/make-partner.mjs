#!/usr/bin/env node
/**
 * Make a user a partner linked to an estate company.
 * Usage: node make-partner.mjs <user-uuid> <estate-company-id> [display-name]
 *
 * Loads env from scripts/.secret.local or scripts/secrets (parent of run/).
 *
 * SQL equivalent (Supabase SQL editor):
 *   update public.profiles
 *   set role = 'partner',
 *       estate_company_id = '<estate-company-id>',
 *       display_name = coalesce('<display-name>', display_name)
 *   where id = '<user-uuid>';
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
const estateCompanyId = process.argv[3];
const displayName = process.argv[4] || null;

if (!uuid || !estateCompanyId) {
  console.error("Usage: node make-partner.mjs <user-uuid> <estate-company-id> [display-name]");
  console.error("Get the UUID from Supabase → Authentication → Users.");
  console.error("Get estate_company_id from public.estate_companies.");
  process.exit(1);
}

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error(
    "Missing SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) or SUPABASE_SERVICE_ROLE_KEY. Add them to scripts/.secret.local or scripts/secrets"
  );
  process.exit(1);
}

const supabase = createClient(url, key);

const { data: company, error: companyError } = await supabase
  .from("estate_companies")
  .select("id, name")
  .eq("id", estateCompanyId)
  .maybeSingle();

if (companyError) {
  console.error("Error checking estate company:", companyError.message);
  process.exit(1);
}
if (!company) {
  console.error("No estate company found with id:", estateCompanyId);
  process.exit(1);
}

const payload = {
  id: uuid,
  role: "partner",
  estate_company_id: estateCompanyId,
  ...(displayName ? { display_name: displayName } : {}),
};

const { data, error } = await supabase
  .from("profiles")
  .upsert(payload, { onConflict: "id" })
  .select()
  .single();

if (error) {
  console.error("Error:", error.message);
  process.exit(1);
}

console.log("Done. User", uuid, "is now a partner for", company.name, `(${company.id}).`);
if (data) console.log("Profile:", data);
