#!/usr/bin/env node
/**
 * Import Facebook post JSON into apartments and estate_companies.
 *
 * Usage:
 *   node scripts/run/import-facebook-posts.mjs <path-to-json>
 *   node scripts/run/import-facebook-posts.mjs posts.json --area=my-khe
 *
 * JSON: array of objects with Facebook post shape (content, attachments,
 * post_id, url, delegate_page_id/profile_id, user_username_raw, page_url,
 * page_logo, avatar_image_url, page_followers, etc.).
 *
 * Requires: scripts/.secret.local with SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.
 * Optional env: VND_TO_USD (default 25000) to convert "X million/month" VND to USD.
 * Optional env: OPENAI_API_KEY — if set, each post's content is sent to OpenAI to extract
 *   structured fields (area_id, title, price, bedrooms, features, etc.) using our areas list.
 * Optional env: OPENAI_MODEL (default gpt-3.5-turbo; set to gpt-4o-mini if your account has access).
 *
 * Run supabase/10-estate-companies.sql first to create estate_companies and new apartment columns.
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { createRequire } from "module";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { filterScrapedPosts } from "./lib/fb-post-quality.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const { sanitizeListingDescription } = require(
  "../../types/dist/lib/sanitize-listing-description.js"
);
const { inferPropertyType, parsePropertyType } = require(
  "../../types/dist/lib/listing-terms.js"
);
const scriptsDir = join(__dirname, "..");
config({ path: join(scriptsDir, ".env") });
config({ path: join(scriptsDir, ".secret.local") });

const jsonPath = process.argv[2];
const areaArg = process.argv.find((a) => a.startsWith("--area="));
const vndToUsd = Number(process.env.VND_TO_USD) || 25000;

if (!jsonPath) {
  console.error("Usage: node scripts/run/import-facebook-posts.mjs <path-to-json> [--area=area_id]");
  console.error("  --area is only used as fallback when not using OpenAI; with OPENAI_API_KEY set, the AI picks area_id per post.");
  process.exit(1);
}

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const openaiKey = process.env.OPENAI_API_KEY;
// gpt-3.5-turbo is available on most OpenAI accounts; use OPENAI_MODEL=gpt-4o-mini if you have access
const openaiModel = process.env.OPENAI_MODEL || "gpt-3.5-turbo";
if (!url || !key) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in scripts/.secret.local");
  process.exit(1);
}

/** @typedef {{ id: string, name: string, vibe?: string }} AreaRow */
/** @typedef {{ area_id: string, title: string, description: string | null, price: number, price_display: string, bedrooms: number, bathrooms: number | null, size_sqm: number | null, features: string[], available_from: string | null, min_lease_months: number | null, property_type: string | null }} ExtractedApartment */

/**
 * Extract title from content (first line or first sentence, cleaned).
 */
function extractTitle(content) {
  if (!content || typeof content !== "string") return "Imported listing";
  const line = content.split(/\n/)[0].replace(/\s+/g, " ").trim();
  if (line.length > 120) return line.slice(0, 117) + "...";
  return line || "Imported listing";
}

/**
 * Parse bedrooms from content. Looks for "3BR", "3 Bedroom", "3Bedroom", etc.
 */
function parseBedrooms(content) {
  if (!content) return 1;
  const m =
    content.match(/(\d+)\s*(?:br|bedroom|bed\s*room)/i) ||
    content.match(/(\d+)\s*floors?\s*\|[^|]*\|\s*(\d+)\s*bed/i);
  if (m) return Math.min(99, parseInt(m[2] ?? m[1], 10));
  return 1;
}

/**
 * Parse bathrooms from content.
 */
function parseBathrooms(content) {
  if (!content) return null;
  const m = content.match(/(\d+)\s*(?:bath|bathroom)/i) || content.match(/(\d+)\s*bathroom/i);
  if (m) return Math.min(99, parseInt(m[1], 10));
  return null;
}

/**
 * Parse price in VND from content ("30million/month", "30 million", "30m", etc.) and convert to USD.
 */
function parsePriceVndToUsd(content) {
  if (!content) return { priceUsd: 0, priceDisplay: "" };
  const normalized = content.replace(/,/g, "").toLowerCase();
  // e.g. 30million/month, 30 million, 30m, 15.5 tr
  let vnd = 0;
  const millionMatch = normalized.match(/(\d+(?:\.\d+)?)\s*(?:million|tr(?:iệu)?|m)(?:\s*\/?\s*month)?/i);
  if (millionMatch) {
    vnd = parseFloat(millionMatch[1]) * 1_000_000;
  } else {
    const numMatch = normalized.match(/(\d[\d.]*)\s*(?:vnd|vnđ|\s*\/?\s*month)/i);
    if (numMatch) vnd = parseFloat(String(numMatch[1]).replace(/\s/g, ""));
  }
  const priceUsd = vnd > 0 ? Math.round(vnd / vndToUsd) : 0;
  const priceDisplay = vnd > 0 ? `~$${priceUsd}/month` : "";
  return { priceUsd, priceDisplay };
}

/**
 * Build system prompt for LLM: our areas and the exact JSON schema. Audience: expats.
 * @param {AreaRow[]} areas
 * @param {number} vndToUsd
 */
function buildExtractionSystemPrompt(areas, vndToUsd) {
  const areaList = areas
    .map((a) => `- "${a.id}": ${a.name}${a.vibe ? ` — ${a.vibe}` : ""}`)
    .join("\n");
  return `You extract rental listing data from Facebook posts for a Da Nang expat-rentals site. The audience is foreigners (digital nomads, remote workers, long-term visitors) looking for apartments or houses in Da Nang, Vietnam. Write for them: clear location, USD pricing, lease terms, and what matters to expats (furnished, internet, safety, proximity to beach/cafes, English-friendly areas).

OUTPUT FORMAT — You must respond with exactly one valid JSON object. No markdown, no code fences, no \`\`\`json, no commentary before or after. Raw JSON only.

REQUIRED JSON SHAPE (use these keys exactly; use null for optional fields when not stated):
{
  "area_id": "<one of the area ids below>",
  "title": "<short title, max 120 chars>",
  "description": "<string or null>",
  "price": <number>,
  "price_display": "<string>",
  "bedrooms": <number>,
  "bathrooms": <number or null>,
  "size_sqm": <number or null>,
  "features": ["<string>", ...],
  "available_from": "<YYYY-MM-DD or null>",
  "min_lease_months": <number or null>,
  "property_type": "<apartment|house|villa|serviced>"
}

AREAS (area_id must be exactly one of these ids):
${areaList}
If the post mentions a ward/area not listed (e.g. Hoa Xuan, Cam Le), choose the closest match or use "other".

FIELD RULES:
- area_id: Exactly one of the ids above. Prefer the area that best matches the post’s location for an expat (e.g. "near Mega market" → consider which area that is; "Hoa Xuan" → "other" unless it clearly fits a listed area).
- title: Short, clear for expats. E.g. "3BR house in Hoa Xuan, furnished" or "Studio near My Khe beach". Max 120 characters.
- description: Full post text or a clear summary. Keep location, price mention, and key perks. Do NOT include phone numbers, emails, Zalo, WhatsApp, or other contact details. Write so an expat can quickly see if it fits (location, USD equivalent, lease length, furnished/amenities).
- price: Monthly rent in USD. Convert from VND using ${vndToUsd} VND = 1 USD (e.g. "30 million/month" → ${Math.round(30_000_000 / vndToUsd)}). Integer. Use 0 only if no price given.
- price_display: String like "~$1200/month" or "From $400/month" or "Price on request" if no price.
- bedrooms, bathrooms: Integers 1–99. bathrooms null if not stated.
- size_sqm: Number or null.
- features: Array of lowercase short phrases expats care about: e.g. "furnished", "balcony", "washing machine", "near beach", "wifi", "air conditioning", "parking", "gym", "pool". Empty array [] if none.
- available_from: "YYYY-MM-DD" only if a specific date is given; otherwise null.
- min_lease_months: Integer (e.g. 6 for "6 month minimum") or null.
- property_type: one of apartment, house, villa, serviced. Use villa for villas; house for houses/townhouses; serviced for serviced apartments; apartment for condo/studio/flat. Default apartment when unclear.

Again: respond with nothing but a single valid JSON object. No markdown, no backticks, no extra text.`;
}

/**
 * Call OpenAI to extract structured apartment fields from post content.
 * @param {string} content
 * @param {AreaRow[]} areas
 * @returns {Promise<ExtractedApartment | null>}
 */
async function extractWithLLM(content, areas) {
  if (!openaiKey || !content?.trim()) return null;
  const systemPrompt = buildExtractionSystemPrompt(areas, vndToUsd);
  const userMessage = `Extract listing data from this Facebook post. Reply with a single JSON object only (no markdown, no code block, no other text):\n\n${content.slice(0, 12000)}`;

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: openaiModel,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        response_format: { type: "json_object" },
        temperature: 0.2,
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      console.warn("OpenAI API error:", res.status, err.slice(0, 200));
      return null;
    }
    const data = await res.json();
    let text = data?.choices?.[0]?.message?.content;
    if (!text || typeof text !== "string") return null;
    text = text.trim();
    // Ensure we parse only JSON: strip markdown code fences if present
    const jsonMatch = text.match(/^```(?:json)?\s*([\s\S]*?)```$/m) || text.match(/^```(?:json)?\s*([\s\S]*)$/m);
    const rawJson = jsonMatch ? jsonMatch[1].trim() : text;
    const parsed = JSON.parse(rawJson);
    const areaIds = new Set(areas.map((a) => a.id));
    const fallbackAreaId = areas[0]?.id ?? "other";
    return {
      area_id: areaIds.has(parsed.area_id) ? parsed.area_id : fallbackAreaId,
      title: String(parsed.title ?? "").slice(0, 500) || "Imported listing",
      description: sanitizeListingDescription(
        parsed.description != null ? String(parsed.description).slice(0, 10000) : null
      ),
      price: Math.max(0, Number(parsed.price) || 0),
      price_display: String(parsed.price_display ?? "").slice(0, 100) || "Price on request",
      bedrooms: Math.min(99, Math.max(0, Number(parsed.bedrooms) || 1)),
      bathrooms:
        parsed.bathrooms != null && parsed.bathrooms !== ""
          ? Math.min(99, Math.max(0, Number(parsed.bathrooms)))
          : null,
      size_sqm:
        parsed.size_sqm != null && parsed.size_sqm !== "" ? Number(parsed.size_sqm) : null,
      features: Array.isArray(parsed.features)
        ? parsed.features.map((f) => String(f).slice(0, 100)).filter(Boolean)
        : [],
      available_from:
        parsed.available_from && /^\d{4}-\d{2}-\d{2}$/.test(String(parsed.available_from))
          ? String(parsed.available_from)
          : null,
      min_lease_months:
        parsed.min_lease_months != null && parsed.min_lease_months !== ""
          ? Math.max(0, Number(parsed.min_lease_months))
          : null,
      property_type: parsePropertyType(parsed.property_type),
    };
  } catch (e) {
    console.warn("LLM extraction failed:", e.message);
    return null;
  }
}

/**
 * Get image URLs from attachments (type photo).
 */
function getImageUrls(post) {
  const attachments = post.attachments || [];
  const urls = attachments.filter((a) => a.type === "photo" && a.url).map((a) => a.url);
  if (urls.length) return urls;
  if (post.post_image) return [post.post_image];
  return [];
}

/**
 * Map one Facebook post object to estate company payload (for upsert).
 */
function toEstateCompany(post) {
  const facebookId = post.delegate_page_id || post.profile_id || String(post.post_id);
  const name = post.user_username_raw || post.profile_handle || "Unknown";
  const pageUrl = post.page_url || post.user_url || null;
  const logoUrl = post.page_logo || post.avatar_image_url || null;
  const pageFollowers = post.page_followers != null ? Number(post.page_followers) : null;
  return {
    facebook_id: String(facebookId),
    name: String(name).slice(0, 500),
    page_url: pageUrl,
    logo_url: logoUrl,
    page_followers: Number.isFinite(pageFollowers) ? pageFollowers : null,
    updated_at: new Date().toISOString(),
  };
}

/**
 * Normalize Facebook post permalink for deduplication (strip trailing slash, fragment, etc.).
 */
function normalizePermalink(url) {
  if (!url || typeof url !== "string") return null;
  const u = url.trim().replace(/#.*$/, "").replace(/\/+$/, "");
  return u || null;
}

/**
 * Map one Facebook post to apartment insert payload. Requires estate_company_id and area_id.
 * If extracted is provided (from LLM), use it for listing fields; otherwise use regex parsing.
 */
function toApartmentRow(post, estateCompanyId, areaId, extracted) {
  const content = post.content || "";
  const images = getImageUrls(post);
  const mainImage = images[0] || post.post_image || "https://placehold.co/800x600?text=No+image";

  if (extracted) {
    return {
      area_id: extracted.area_id,
      estate_company_id: estateCompanyId || null,
      source_url: normalizePermalink(post.url || post.input?.url) || (post.url || post.input?.url) || null,
      source_post_id: post.post_id ? String(post.post_id) : null,
      title: extracted.title.slice(0, 500),
      description: sanitizeListingDescription(extracted.description),
      price: extracted.price,
      price_display: extracted.price_display || "Price on request",
      main_image: mainImage,
      images: images.length > 1 ? images.slice(1) : [],
      bedrooms: extracted.bedrooms,
      bathrooms: extracted.bathrooms,
      size_sqm: extracted.size_sqm,
      features: extracted.features || [],
      available_from: extracted.available_from,
      min_lease_months: extracted.min_lease_months,
      property_type:
        extracted.property_type ||
        inferPropertyType(extracted.title, extracted.description),
      sort_order: 0,
    };
  }

  const title = extractTitle(content);
  const bedrooms = parseBedrooms(content);
  const bathrooms = parseBathrooms(content);
  const { priceUsd, priceDisplay } = parsePriceVndToUsd(content);
  const description = sanitizeListingDescription(content.slice(0, 10000) || null);

  return {
    area_id: areaId,
    estate_company_id: estateCompanyId || null,
    source_url: normalizePermalink(post.url || post.input?.url) || (post.url || post.input?.url) || null,
    source_post_id: post.post_id ? String(post.post_id) : null,
    title: title.slice(0, 500),
    description,
    price: Math.max(0, priceUsd),
    price_display: priceDisplay || "Price on request",
    main_image: mainImage,
    images: images.length > 1 ? images.slice(1) : [],
    bedrooms,
    bathrooms,
    size_sqm: null,
    features: [],
    available_from: null,
    min_lease_months: null,
    property_type: inferPropertyType(title, description),
    sort_order: 0,
  };
}

async function main() {
  const resolvedPath = join(process.cwd(), jsonPath);
  let raw;
  try {
    raw = readFileSync(resolvedPath, "utf8");
  } catch (e) {
    console.error("Failed to read file:", resolvedPath, e.message);
    process.exit(1);
  }

  let posts;
  try {
    posts = JSON.parse(raw);
  } catch (e) {
    console.error("Invalid JSON:", e.message);
    process.exit(1);
  }

  if (!Array.isArray(posts)) {
    console.error("JSON must be an array of post objects.");
    process.exit(1);
  }

  {
    const shaped = posts.map((p) => ({
      ...p,
      text: p.content || p.text || "",
    }));
    const before = shaped.length;
    const { kept, rejected } = filterScrapedPosts(shaped);
    posts = kept;
    if (rejected.length) {
      console.log(`Filtered ${rejected.length}/${before} weak posts before import:`);
      for (const r of rejected) {
        console.log(`  skip early (${r.reason}): ${r.preview}`);
      }
    }
  }

  const supabase = createClient(url, key);

  // Fetch all areas first (needed for LLM prompt; AI defines area_id per post when OPENAI_API_KEY is set)
  const { data: areasList, error: areasError } = await supabase.from("areas").select("id, name, vibe");
  if (areasError) {
    console.error("Failed to fetch areas:", areasError.message);
    process.exit(1);
  }
  const areas = Array.isArray(areasList) ? areasList : [];
  if (areas.length === 0) {
    console.error("No areas in database. Add areas first.");
    process.exit(1);
  }

  // Default area: only used when not using LLM (regex path) or when LLM returns invalid area
  const requestedAreaId = areaArg ? areaArg.replace("--area=", "").trim() : null;
  const defaultAreaId = requestedAreaId
    ? (areas.some((a) => a.id === requestedAreaId) ? requestedAreaId : null)
    : areas[0].id;
  if (requestedAreaId && !defaultAreaId) {
    console.error("Area not found:", requestedAreaId);
    console.error("Valid area_id values:", areas.map((a) => a.id).join(", "));
    process.exit(1);
  }

  if (openaiKey) {
    console.log("Using OpenAI to extract listing fields (including area_id) from each post.");
  } else {
    console.log("No OPENAI_API_KEY: using regex parsing; area_id =", defaultAreaId);
  }

  let companiesUpserted = 0;
  let apartmentsInserted = 0;
  let apartmentsSkipped = 0;

  for (const post of posts) {
    const ec = toEstateCompany(post);
    const { error: ecError } = await supabase
      .from("estate_companies")
      .upsert(
        { ...ec, updated_at: new Date().toISOString() },
        { onConflict: "facebook_id", ignoreDuplicates: false }
      );

    if (ecError) {
      console.error("Estate company upsert error:", ec.facebook_id, ecError.message);
      continue;
    }
    companiesUpserted += 1;

    const { data: ecRow } = await supabase
      .from("estate_companies")
      .select("id")
      .eq("facebook_id", ec.facebook_id)
      .single();
    const estateCompanyId = ecRow?.id ?? null;

    const permalink = normalizePermalink(post.url || post.input?.url);
    const postId = post.post_id ? String(post.post_id) : null;

    // Skip if we already have this property (by permalink or post_id)
    if (permalink || postId) {
      let existing = null;
      if (permalink && postId) {
        const { data: byUrl } = await supabase
          .from("apartments")
          .select("id")
          .eq("source_url", permalink)
          .maybeSingle();
        const { data: byPostId } = await supabase
          .from("apartments")
          .select("id")
          .eq("source_post_id", postId)
          .maybeSingle();
        existing = byUrl ?? byPostId;
      } else if (permalink) {
        const { data } = await supabase
          .from("apartments")
          .select("id")
          .eq("source_url", permalink)
          .maybeSingle();
        existing = data;
      } else {
        const { data } = await supabase
          .from("apartments")
          .select("id")
          .eq("source_post_id", postId)
          .maybeSingle();
        existing = data;
      }
      if (existing) {
        apartmentsSkipped += 1;
        continue;
      }
    }

    let extracted = null;
    if (openaiKey && (post.content || "").trim()) {
      extracted = await extractWithLLM(post.content, areas);
      await new Promise((r) => setTimeout(r, 250));
    }
    const row = toApartmentRow(
      post,
      estateCompanyId,
      defaultAreaId,
      extracted
    );
    const { error: aptError } = await supabase.from("apartments").insert(row);

    if (aptError) {
      console.error("Apartment insert error:", post.post_id || "(no id)", aptError.message);
      continue;
    }
    apartmentsInserted += 1;
  }

  console.log("Done. Estate companies upserted:", companiesUpserted);
  console.log("Apartments inserted:", apartmentsInserted);
  if (apartmentsSkipped) console.log("Apartments skipped (duplicate permalink/post_id):", apartmentsSkipped);
}

main();
