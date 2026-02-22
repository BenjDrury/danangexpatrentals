#!/usr/bin/env node
/**
 * Merge scripts/data/areas.csv (base) with scripts/data/areas-additional.csv (display fields).
 * Writes combined result to scripts/data/areas.csv. Use this when you edit areas-additional.csv
 * and want to refresh the display columns in areas.csv. Seed script uses only areas.csv.
 *
 * Matches additional rows to base by area_id. Mapping: additional "name" -> base area_id
 * (first match wins): My An Beach/An Thuong->DN-A, Phuoc My->DN-B, Hai Chau Center->DN-C,
 * Thanh Khe->DN-D, Ngu Hanh Son Inland->DN-E, Lien Chieu Coast->DN-F. DN-G, DN-H get no overlay.
 */

import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, "..", "data");
const basePath = join(dataDir, "areas.csv");
const additionalPath = join(dataDir, "areas-additional.csv");

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

function parseCSV(csvText) {
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return { headers: [], rows: [] };
  const headers = parseCSVLine(lines[0]);
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row = {};
    headers.forEach((h, j) => {
      row[h] = values[j] ?? "";
    });
    rows.push(row);
  }
  return { headers, rows };
}

function escapeCsv(val) {
  const s = String(val ?? "");
  if (s.includes(",") || s.includes('"') || s.includes("\n") || s.includes("\r")) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

// Which additional row to use for each base area_id (by additional "name")
const nameToAreaId = {
  "My An Beach": "DN-A",
  "An Thuong": "DN-A",
  "Phuoc My": "DN-B",
  "Son Tra Peninsula": null, // no base row
  "Hai Chau Center": "DN-C",
  "Han River West": null,
  "Hoa Cuong / Helio": null,
  "Ngu Hanh Son Inland": "DN-E",
  "Hoa Hai Coast": null,
  "Lien Chieu Coast": "DN-F",
  "Thanh Khe": "DN-D",
};

const baseCsv = readFileSync(basePath, "utf8");
const additionalCsv = readFileSync(additionalPath, "utf8");

const base = parseCSV(baseCsv);
const additional = parseCSV(additionalCsv);

const extraHeaders = [
  "aliases",
  "images",
  "vibe",
  "forWho",
  "District",
  "Distance_to_Beach_km",
  "Distance_to_CBD_km",
  "Typical_Rent_1BR_USD",
  "Typical_Rent_2BR_USD",
  "Expat_Density",
  "Noise_Level",
  "Flood_Risk",
  "Walkability_Score",
  "Amenities_Score",
  "Long_Term_Rental_Suitability",
  "Pros",
  "Cons",
];

const allHeaders = [...base.headers];
for (const h of extraHeaders) {
  if (!base.headers.includes(h)) allHeaders.push(h);
}

const additionalByAreaId = {};
for (const row of additional.rows) {
  const name = (row.name || row.Name || "").trim();
  const areaId = nameToAreaId[name];
  if (areaId && !additionalByAreaId[areaId]) {
    additionalByAreaId[areaId] = row;
  }
}

const outLines = [allHeaders.map(escapeCsv).join(",")];

for (const baseRow of base.rows) {
  const areaId = (baseRow.area_id || baseRow.id || "").trim();
  const extra = additionalByAreaId[areaId] || {};
  const row = { ...baseRow };
  for (const h of extraHeaders) {
    if (extra[h] !== undefined && extra[h] !== "") {
      row[h] = extra[h];
    }
  }
  outLines.push(allHeaders.map((h) => escapeCsv(row[h])).join(","));
}

writeFileSync(basePath, outLines.join("\n") + "\n", "utf8");
console.log("Merged", base.rows.length, "rows into", basePath);
