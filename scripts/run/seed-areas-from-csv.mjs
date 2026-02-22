#!/usr/bin/env node
/**
 * Seed or update public.areas from a CSV file.
 * Usage: node seed-areas-from-csv.mjs <path-to-csv>
 *
 * CSV must have a header row. Expected columns (order doesn't matter):
 *   id, name, image, vibe, price_range, who
 *
 * Uses scripts/.secret.local or scripts/secrets for SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.
 * Send your CSV format if columns differ — we can adjust the mapping.
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const scriptsDir = join(__dirname, "..");
config({ path: join(scriptsDir, ".secret.local") });
config({ path: join(scriptsDir, "secrets") });

const csvPath = process.argv[2];
if (!csvPath) {
  console.error("Usage: node seed-areas-from-csv.mjs <path-to-csv>");
  console.error("Example: node scripts/run/seed-areas-from-csv.mjs areas.csv");
  process.exit(1);
}

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in scripts/.secret.local or scripts/secrets");
  process.exit(1);
}

/**
 * Parse a single CSV line, respecting double-quoted fields (commas inside quotes stay).
 */
function parseCSVLine(line) {
  const out = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      inQuotes = !inQuotes;
    } else if (c === "," && !inQuotes) {
      out.push(cur.trim());
      cur = "";
    } else {
      cur += c;
    }
  }
  out.push(cur.trim());
  return out;
}

/**
 * Parse CSV string into rows of objects using first row as headers.
 * Header names are trimmed and lowercased for matching.
 */
function parseCSV(csvText) {
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];
  const headers = parseCSVLine(lines[0]).map((h) => h.toLowerCase().trim());
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row = {};
    headers.forEach((h, j) => {
      row[h] = values[j] ?? "";
    });
    rows.push(row);
  }
  return rows;
}

/** Map CSV row to areas table columns. Override keys here if your CSV uses different headers. */
const COLUMN_MAP = {
  id: ["id"],
  name: ["name"],
  image: ["image", "image_url", "img"],
  vibe: ["vibe"],
  price_range: ["price_range", "pricerange", "price range"],
  who: ["who", "who_its_for", "who it's for"],
};

function findValue(row, keys) {
  const lower = {};
  for (const [k, v] of Object.entries(row)) {
    lower[k.toLowerCase().trim()] = v;
  }
  for (const key of keys) {
    if (lower[key] !== undefined && lower[key] !== "") return String(lower[key]).trim();
  }
  return "";
}

function rowToArea(row) {
  return {
    id: findValue(row, COLUMN_MAP.id) || undefined,
    name: findValue(row, COLUMN_MAP.name) || undefined,
    image: findValue(row, COLUMN_MAP.image) || undefined,
    vibe: findValue(row, COLUMN_MAP.vibe) || undefined,
    price_range: findValue(row, COLUMN_MAP.price_range) || undefined,
    who: findValue(row, COLUMN_MAP.who) || undefined,
  };
}

async function main() {
  const resolvedPath = join(process.cwd(), csvPath);
  let csvText;
  try {
    csvText = readFileSync(resolvedPath, "utf8");
  } catch (e) {
    console.error("Failed to read file:", resolvedPath, e.message);
    process.exit(1);
  }

  const rows = parseCSV(csvText);
  if (rows.length === 0) {
    console.error("No data rows in CSV (need header + at least one row).");
    process.exit(1);
  }

  const areas = rows.map(rowToArea).filter((a) => a.id && a.name);
  if (areas.length === 0) {
    console.error("No valid rows: each row needs at least 'id' and 'name'.");
    process.exit(1);
  }

  const supabase = createClient(url, key);
  const { data, error } = await supabase.from("areas").upsert(areas, { onConflict: "id" }).select("id");

  if (error) {
    console.error("Supabase error:", error.message);
    process.exit(1);
  }

  console.log("Upserted", data?.length ?? areas.length, "areas.");
}

main();
