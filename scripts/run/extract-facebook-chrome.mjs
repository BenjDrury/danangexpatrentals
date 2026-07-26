#!/usr/bin/env node
/**
 * Extract listing posts from a logged-in Google Chrome Facebook tab (macOS),
 * write JSON, and seed estate_companies + draft apartments (with Storage photos).
 *
 * Preconditions:
 *   - macOS + Google Chrome
 *   - Logged into Facebook in that Chrome profile
 *   - Target group-user or profile page open, OR pass --url=
 *   - Allow Chrome automation if macOS prompts (System Settings → Privacy)
 *
 * Usage (from repo root):
 *   node scripts/run/extract-facebook-chrome.mjs
 *   node scripts/run/extract-facebook-chrome.mjs --url='https://www.facebook.com/groups/.../user/...'
 *   node scripts/run/extract-facebook-chrome.mjs --dry-run --limit=5
 *   node scripts/run/extract-facebook-chrome.mjs --logo-only --url='https://www.facebook.com/groups/.../user/...'
 *   node scripts/run/extract-facebook-chrome.mjs --out=tmp_fb/export.json --area=my-khe --status=draft
 *
 * Requires (unless --dry-run): scripts/.secret.local with SUPABASE_URL (or
 * NEXT_PUBLIC_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY.
 * Optional: OPENAI_API_KEY (recommended) — each post is sent to OpenAI to fill
 *   title, description, price, area_id, bedrooms, features, etc.
 * Optional: OPENAI_MODEL (default gpt-4o-mini).
 * Optional: VND_TO_USD (default 25000).
 */

import { createClient } from "@supabase/supabase-js";
import { createHash } from "crypto";
import { config } from "dotenv";
import { mkdirSync, mkdtempSync, writeFileSync, rmSync, readFileSync } from "fs";
import { dirname, join, resolve } from "path";
import { fileURLToPath } from "url";
import { execFileSync } from "child_process";
import { tmpdir } from "os";

const __dirname = dirname(fileURLToPath(import.meta.url));
const scriptsDir = join(__dirname, "..");
config({ path: join(scriptsDir, ".env") });
config({ path: join(scriptsDir, ".secret.local") });
config({ path: join(scriptsDir, "secrets") });

const args = process.argv.slice(2);
function flag(name, fallback = null) {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  if (hit) return hit.slice(name.length + 3);
  if (args.includes(`--${name}`)) return true;
  return fallback;
}

const dryRun = flag("dry-run") === true;
const logoOnly = flag("logo-only") === true;
const limit = logoOnly
  ? 0
  : Math.max(1, Math.min(30, Number(flag("limit", "5")) || 5));
const maxImages = Math.max(1, Math.min(40, Number(flag("images", "20")) || 20));
// Reject thumbnails/avatars — real listing photos are usually >> 25KB
const minImageBytes = Math.max(
  5_000,
  Number(flag("min-image-bytes", "25000")) || 25_000
);
// Max scroll steps; we stop early once we have --limit posts. Default is modest.
const scrollCount = logoOnly
  ? 0
  : Math.max(
      0,
      Math.min(30, Number(flag("scrolls", String(Math.max(4, limit)))) || Math.max(4, limit))
    );
const status = String(flag("status", "draft") || "draft");
const areaArg = flag("area", null);
const navigateUrl = flag("url", null);
const skipLlm = flag("no-llm") === true;
const outPath = resolve(
  process.cwd(),
  flag("out", join("tmp_fb", `fb-extract-${Date.now()}.json`))
);
const matchHint =
  flag("match", null) ||
  (navigateUrl
    ? navigateUrl.match(/\/user\/(\d+)/)?.[1] ||
      navigateUrl.match(/[?&]id=(\d+)/)?.[1] ||
      navigateUrl
    : "facebook.com");

const vndToUsd = Number(process.env.VND_TO_USD) || 25000;
const openaiKey = process.env.OPENAI_API_KEY || "";
const openaiModel = process.env.OPENAI_MODEL || "gpt-4o";
const ALLOWED_STATUSES = new Set([
  "draft",
  "pending_review",
  "available",
  "reserved",
  "rented",
]);
if (!ALLOWED_STATUSES.has(status)) {
  console.error("Invalid --status. Use one of:", [...ALLOWED_STATUSES].join(", "));
  process.exit(1);
}

function asQuote(s) {
  return `"${String(s).replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

const EXTRACT_JS_PATH = join(__dirname, "lib", "fb-chrome-extract.in.js");

function loadExtractJs() {
  return readFileSync(EXTRACT_JS_PATH, "utf8")
    .replace(/__LIMIT__/g, String(limit))
    .replace(/__IMAGES__/g, String(maxImages));
}

function runOsascript(source) {
  const dir = mkdtempSync(join(tmpdir(), "fb-as-"));
  const path = join(dir, "run.applescript");
  writeFileSync(path, source, "utf8");
  try {
    return execFileSync("osascript", [path], {
      encoding: "utf8",
      maxBuffer: 32 * 1024 * 1024,
      timeout: 180_000,
    }).trim();
  } catch (e) {
    const msg = e.stderr?.toString?.() || e.message;
    throw new Error(`AppleScript failed: ${msg}`);
  } finally {
    try {
      rmSync(dir, { recursive: true, force: true });
    } catch {
      /* ignore */
    }
  }
}

function navigateChrome(url) {
  runOsascript(`
tell application "Google Chrome"
  activate
  if (count of windows) = 0 then
    make new window
  end if
  set URL of active tab of front window to ${asQuote(url)}
end tell
`);
  execFileSync("sleep", ["8"]);
}

function findAndExtract() {
  const tmp = mkdtempSync(join(tmpdir(), "fb-extract-"));
  const jsPath = join(tmp, "extract.js");
  const extractJs = loadExtractJs();
  writeFileSync(jsPath, extractJs, "utf8");

  try {
    // Activate matching Chrome tab once
    runOsascript(`
set matchHint to ${asQuote(matchHint)}
tell application "Google Chrome"
  set foundWin to missing value
  set foundTabIndex to 0
  repeat with w in windows
    set i to 0
    repeat with t in tabs of w
      set i to i + 1
      try
        set u to URL of t
        if u contains matchHint then
          set foundWin to w
          set foundTabIndex to i
          exit repeat
        end if
      end try
    end repeat
    if foundWin is not missing value then exit repeat
  end repeat
  if foundWin is missing value then
    if (count of windows) = 0 then error "No Chrome windows open. Open Facebook in Chrome first."
    set foundWin to front window
    set foundTabIndex to active tab index of foundWin
    set u to URL of active tab of foundWin
    if u does not contain "facebook.com" then
      error "No tab matching " & matchHint & ". Open the Facebook profile/group-user page in Chrome (or pass --url=)."
    end if
  end if
  set index of foundWin to 1
  set active tab index of foundWin to foundTabIndex
  set t to active tab of foundWin
  execute t javascript "window.scrollTo(0, 0); true;"
end tell
`);
    execFileSync("sleep", ["0.6"]);

    /** @type {any} */
    let best = null;
    for (let step = 0; step <= scrollCount; step++) {
      if (step > 0) {
        // Small steps so we don't jump past the first N listings
        runOsascript(`
tell application "Google Chrome"
  set t to active tab of front window
  execute t javascript "window.scrollBy(0, 850); true;"
  delay 0.35
  execute t javascript "(() => { for (const el of document.querySelectorAll('[role=\\"button\\"], div[tabindex=\\"0\\"]')) { const t = (el.innerText || '').trim(); if (/^see more$/i.test(t) || /^xem thêm$/i.test(t)) { try { el.click(); } catch (e) {} } } return true; })();"
end tell
`);
        execFileSync("sleep", ["0.45"]);
      } else {
        runOsascript(`
tell application "Google Chrome"
  set t to active tab of front window
  execute t javascript "(() => { for (const el of document.querySelectorAll('[role=\\"button\\"], div[tabindex=\\"0\\"]')) { const t = (el.innerText || '').trim(); if (/^see more$/i.test(t) || /^xem thêm$/i.test(t)) { try { el.click(); } catch (e) {} } } return true; })();"
end tell
`);
        execFileSync("sleep", ["0.35"]);
      }

      const raw = runOsascript(`
set jsPath to ${asQuote(jsPath)}
set jsCode to read POSIX file jsPath as «class utf8»
tell application "Google Chrome"
  set t to active tab of front window
  return execute t javascript jsCode
end tell
`);
      if (!raw || raw === "missing value") {
        console.warn(`  extract step ${step}: empty result`);
        continue;
      }
      let data;
      try {
        data = JSON.parse(raw);
      } catch {
        console.warn(`  extract step ${step}: bad JSON`);
        continue;
      }
      const n = data.posts?.length ?? 0;
      best = data;
      console.log(`  feed step ${step}: ${n}/${limit} posts`);
      if (n >= limit) break;
    }

    if (!best) throw new Error("Chrome returned empty extract result");
    if (logoOnly) {
      best.posts = [];
      return best;
    }
    return enrichImagesFromLightbox(best);
  } finally {
    try {
      rmSync(tmp, { recursive: true, force: true });
    } catch {
      /* ignore */
    }
  }
}

function enrichImagesFromLightbox(data) {
  if (!data?.posts?.length) return data;
  console.log("Enriching photos via Chrome lightbox…");
  const posts = data.posts;
  const dir = mkdtempSync(join(tmpdir(), "fb-lightbox-"));
  try {
    runOsascript(`
tell application "Google Chrome"
  set t to active tab of front window
  execute t javascript "window.scrollTo(0,0); true;"
end tell
`);
    execFileSync("sleep", ["0.5"]);

    for (let i = 0; i < posts.length; i++) {
      const snippet = (posts[i].text || "").replace(/\s+/g, " ").slice(0, 40);
      const openPath = join(dir, `open-${i}.js`);
      const collectPath = join(dir, `collect-${i}.js`);
      writeFileSync(
        openPath,
        `(() => {
  const needles = [
    ${JSON.stringify(snippet)},
    ${JSON.stringify(snippet.slice(0, 24))},
    ${JSON.stringify((posts[i].text || "").match(/(?:CHO THUÊ|Cho thuê|House for rent|For rent|NCC)[^.]{0,40}/i)?.[0] || "")},
  ].filter(Boolean);
  function tryOpen(el) {
    const imgs = [...el.querySelectorAll("img")].filter((img) => {
      const s = img.currentSrc || img.src || "";
      return /scontent|fbcdn/.test(s) && (img.naturalWidth || 0) >= 100;
    });
    if (imgs.length) {
      try { imgs.sort((a,b)=>(b.naturalWidth*b.naturalHeight)-(a.naturalWidth*a.naturalHeight))[0].click(); return true; } catch (e) {}
    }
    const plus = [...el.querySelectorAll("span, div, a")].find((n) =>
      /^\\+\\d+$/.test((n.innerText || "").trim())
    );
    if (plus) {
      try { plus.click(); return true; } catch (e) {}
    }
    return false;
  }
  for (const needle of needles) {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const v = (walker.currentNode.nodeValue || "").replace(/\\s+/g, " ");
      if (!v.includes(needle.slice(0, Math.min(16, needle.length)))) continue;
      let el = walker.currentNode.parentElement;
      for (let d = 0; d < 20 && el; d++) {
        if (tryOpen(el)) return "opened:" + needle.slice(0, 20);
        el = el.parentElement;
      }
    }
  }
  // Fallback: open Nth large listing image on page
  const big = [...document.querySelectorAll("img")]
    .filter((img) => /scontent|fbcdn/.test(img.currentSrc || img.src || "") && (img.naturalWidth || 0) >= 280)
    .slice(0, 40);
  if (big[${i}]) {
    try { big[${i}].click(); return "opened-nth"; } catch (e) {}
  }
  return "miss";
})();`,
        "utf8"
      );
      writeFileSync(
        collectPath,
        `(() => {
  function upgrade(url) {
    return (url || "").replace(/ctp=p\\d+x\\d+/g, "ctp=s2048x2048").replace(/&amp;/g, "&");
  }
  function key(src) {
    const m = src.match(/\\/(\\d+_\\d+_\\d+_n)\\./);
    return m ? m[1] : src.split("?")[0];
  }
  const roots = [
    document.querySelector('[role="dialog"]'),
    document.querySelector('[aria-label*="Photo"]'),
    document.querySelector('[aria-label*="photo"]'),
    ...document.querySelectorAll('div[style*="z-index"]'),
    document.body,
  ].filter(Boolean);
  const urls = [];
  const seen = new Set();
  function add(src) {
    src = upgrade(src);
    if (!src || !/scontent|fbcdn/.test(src)) return;
    if (/s24x24|s32x32|s40x40|s48x48|s50x50|s60x60|s200x200|p160x160|static\\.xx\\.fbcdn|ctp=p\\d+x\\d+/.test(src)) return;
    const k = key(src);
    if (seen.has(k)) return;
    seen.add(k);
    urls.push(src);
  }
  for (const root of roots) {
    for (const img of root.querySelectorAll("img")) {
      add(img.currentSrc || img.src || "");
      const srcset = img.getAttribute("srcset") || "";
      for (const part of srcset.split(",")) {
        const u = part.trim().split(/\\s+/)[0];
        if (u) add(u);
      }
    }
    const html = root.innerHTML || "";
    const re = /https:\\/\\/[^"'\\\\\\s<>]+(?:scontent|fbcdn\\.net)[^"'\\\\\\s<>]*/g;
    let m;
    while ((m = re.exec(html)) !== null) add(m[0]);
    if (urls.length >= ${maxImages}) break;
  }
  return JSON.stringify(urls.slice(0, ${maxImages}));
})();`,
        "utf8"
      );

      try {
        const openResult = runOsascript(`
set jsPath to ${asQuote(openPath)}
set jsCode to read POSIX file jsPath as «class utf8»
tell application "Google Chrome"
  set t to active tab of front window
  return execute t javascript jsCode
end tell
`);
        if (!openResult || openResult === "miss") {
          console.warn(`  lightbox post ${i + 1}: could not open album`);
          continue;
        }
        execFileSync("sleep", ["1.0"]);
        const allExtra = [];
        const seenExtra = new Set();
        const harvest = () => {
          const collectedRaw = runOsascript(`
set jsPath to ${asQuote(collectPath)}
set jsCode to read POSIX file jsPath as «class utf8»
tell application "Google Chrome"
  set t to active tab of front window
  return execute t javascript jsCode
end tell
`);
          if (!collectedRaw || collectedRaw === "missing value") return;
          try {
            const batch = JSON.parse(collectedRaw);
            if (!Array.isArray(batch)) return;
            for (const u of batch) {
              const k = u.match(/\/(\d+_\d+_\d+_n)\./)?.[1] || u.split("?")[0];
              if (seenExtra.has(k)) continue;
              seenExtra.add(k);
              allExtra.push(u);
            }
          } catch {
            /* ignore */
          }
        };
        harvest();
        for (let step = 0; step < Math.min(18, maxImages); step++) {
          const stepped = runOsascript(`
tell application "Google Chrome"
  set t to active tab of front window
  return execute t javascript "(() => { const n = document.querySelector('[aria-label=\\"Next\\"], [aria-label=\\"Next photo\\"]'); if (n) { n.click(); return 'ok'; } return 'no'; })();"
end tell
`);
          if (stepped === "no") break;
          execFileSync("sleep", ["0.35"]);
          harvest();
          if (allExtra.length >= maxImages) break;
        }
        runOsascript(`
tell application "Google Chrome"
  set t to active tab of front window
  execute t javascript "document.dispatchEvent(new KeyboardEvent('keydown', {key:'Escape', bubbles:true})); true;"
end tell
`);
        execFileSync("sleep", ["0.35"]);
        if (!allExtra.length) {
          console.warn(`  lightbox post ${i + 1}: empty album (${openResult})`);
          runOsascript(`
tell application "Google Chrome"
  set t to active tab of front window
  execute t javascript "document.dispatchEvent(new KeyboardEvent('keydown', {key:'Escape', bubbles:true})); window.scrollBy(0, 900); true;"
end tell
`);
          execFileSync("sleep", ["0.5"]);
          continue;
        }
        const merged = [];
        const seen = new Set();
        for (const u of [...(posts[i].images || []), ...allExtra]) {
          const k = u.match(/\/(\d+_\d+_\d+_n)\./)?.[1] || u.split("?")[0];
          if (seen.has(k)) continue;
          seen.add(k);
          merged.push(u);
          if (merged.length >= maxImages) break;
        }
        posts[i].images = merged;
        console.log(`  lightbox post ${i + 1}: ${merged.length} images (${openResult})`);
        runOsascript(`
tell application "Google Chrome"
  set t to active tab of front window
  execute t javascript "document.dispatchEvent(new KeyboardEvent('keydown', {key:'Escape', bubbles:true})); true;"
end tell
`);
        execFileSync("sleep", ["0.45"]);
        // Nudge feed so next post is findable again
        runOsascript(`
tell application "Google Chrome"
  set t to active tab of front window
  execute t javascript "window.scrollBy(0, 700); true;"
end tell
`);
        execFileSync("sleep", ["0.35"]);
      } catch (e) {
        console.warn(`  lightbox post ${i + 1} skipped:`, (e.message || String(e)).slice(0, 120));
      }
    }
  } finally {
    try {
      rmSync(dir, { recursive: true, force: true });
    } catch {
      /* ignore */
    }
  }
  return data;
}

function extractTitle(content) {
  if (!content || typeof content !== "string") return "Imported listing";
  const line = content.split(/\n/)[0].replace(/\s+/g, " ").trim();
  const cut = line.split(/\s+(?:Location:|•|See more)/i)[0].trim();
  const title = cut || line;
  if (title.length > 120) return title.slice(0, 117) + "...";
  return title || "Imported listing";
}

function parseBedrooms(content) {
  if (!content) return 1;
  const m =
    content.match(/(\d+)\s*(?:br|bedroom|bed\s*room)/i) ||
    content.match(/(\d+)\s*floors?\s*\|[^|]*\|\s*(\d+)\s*bed/i);
  if (m) return Math.min(99, parseInt(m[2] ?? m[1], 10));
  return 1;
}

function parseBathrooms(content) {
  if (!content) return null;
  const m = content.match(/(\d+)\s*(?:bath|bathroom)/i);
  if (m) return Math.min(99, parseInt(m[1], 10));
  return null;
}

function parsePriceVndToUsd(content) {
  if (!content) return { priceUsd: 0, priceDisplay: "" };
  const normalized = content.replace(/,/g, "").toLowerCase();
  let vnd = 0;
  const millionMatch = normalized.match(
    /(\d+(?:\.\d+)?)\s*(?:million|tr(?:iệu)?|m)(?:\s*\/?\s*month)?/i
  );
  if (millionMatch) {
    vnd = parseFloat(millionMatch[1]) * 1_000_000;
  } else {
    const usdMatch = normalized.match(/\$\s*(\d[\d,]*(?:\.\d+)?)/);
    if (usdMatch) {
      const usd = Math.round(parseFloat(usdMatch[1].replace(/,/g, "")));
      return { priceUsd: usd, priceDisplay: `~$${usd}/month` };
    }
  }
  const priceUsd = vnd > 0 ? Math.round(vnd / vndToUsd) : 0;
  const priceDisplay = vnd > 0 ? `~$${priceUsd}/month` : "";
  return { priceUsd, priceDisplay };
}

function normalizePermalink(url) {
  if (!url || typeof url !== "string") return null;
  const u = url.trim().replace(/#.*$/, "").replace(/\/+$/, "");
  return u || null;
}

function postHash(post) {
  if (post.postId) return String(post.postId);
  const basis = `${post.permalink || ""}|${(post.text || "").slice(0, 120)}`;
  return createHash("sha1").update(basis).digest("hex").slice(0, 16);
}

/**
 * @param {{ id: string, name: string, vibe?: string }[]} areas
 */
function buildExtractionSystemPrompt(areas) {
  const areaList = areas
    .map((a) => `- "${a.id}": ${a.name}${a.vibe ? ` — ${a.vibe}` : ""}`)
    .join("\n");
  return `You extract rental listing data from Facebook posts for a Da Nang expat-rentals site. The audience is foreigners (digital nomads, remote workers, long-term visitors) looking for apartments or houses in Da Nang, Vietnam. Write for them: clear location, USD pricing, lease terms, and what matters to expats (furnished, internet, safety, proximity to beach/cafes, English-friendly areas).

OUTPUT FORMAT — You must respond with exactly one valid JSON object. No markdown, no code fences, no commentary. Raw JSON only.

REQUIRED JSON SHAPE:
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
  "contact_phone": "<string or null>",
  "contact_whatsapp": "<string or null>",
  "contact_email": "<string or null>"
}

AREAS (area_id must be exactly one of these ids):
${areaList}
If the post mentions a ward/area not listed, choose the closest match or use "other".

FIELD RULES:
- title: Short, clear English for expats. E.g. "3BR furnished house near Dragon Bridge" or "Studio near My Khe beach". Max 120 characters. Do not paste raw Vietnamese marketing headers like "NCC - CHO THUÊ…" — translate/summarize.
- description: Clear English summary for expats. Keep location, price, rooms, key amenities, and contact (phone/Zalo/WhatsApp) if present. You may keep original Vietnamese phrases in parentheses when helpful.
- price: Monthly rent in USD. Convert from VND using ${vndToUsd} VND = 1 USD. Integer. Use 0 only if no price given.
- price_display: e.g. "~$1000/month" or "Price on request".
- bedrooms, bathrooms: Integers; bathrooms null if unknown.
- features: lowercase short phrases: furnished, balcony, parking, near beach, wifi, air conditioning, etc.
- available_from / min_lease_months: only when stated; else null.
- contact_phone / contact_whatsapp / contact_email: extract seller contact from the post when present (phone, Zalo, WhatsApp, email). Normalize phones to digits with optional leading +. Use null when absent. Do not invent contacts.`;
}

/** Regex fallback when LLM is off or misses contact fields. */
function extractContactFromText(text) {
  if (!text || typeof text !== "string") {
    return { contact_phone: null, contact_whatsapp: null, contact_email: null };
  }

  const emailMatch = text.match(
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/
  );
  const contact_email = emailMatch ? emailMatch[0].slice(0, 200) : null;

  const phoneMatches = [
    ...text.matchAll(/(?:\+84|0)(?:[\s.\-]?\d){8,11}/g),
  ].map((m) => m[0].replace(/[^\d+]/g, "").slice(0, 20));

  let contact_phone = phoneMatches[0] || null;
  let contact_whatsapp = null;

  const zaloBlock = text.match(
    /(?:zalo|whatsapp|wa\.me|line)[:\s]*([+\d][\d\s.\-]{7,18})/i
  );
  if (zaloBlock) {
    contact_whatsapp = zaloBlock[1].replace(/[^\d+]/g, "").slice(0, 20);
    if (!contact_phone) contact_phone = contact_whatsapp;
  } else if (/zalo|whatsapp/i.test(text) && contact_phone) {
    contact_whatsapp = contact_phone;
  }

  return { contact_phone, contact_whatsapp, contact_email };
}

function firstNonEmpty(...values) {
  for (const v of values) {
    if (v == null) continue;
    const s = String(v).trim();
    if (s) return s;
  }
  return null;
}

function normalizeContactPhone(value) {
  if (!value) return null;
  const cleaned = String(value).replace(/[^\d+]/g, "").slice(0, 20);
  return cleaned.length >= 8 ? cleaned : null;
}

function normalizeContactEmail(value) {
  if (!value) return null;
  const s = String(value).trim().slice(0, 200);
  return s.includes("@") ? s : null;
}

/**
 * @param {string} content
 * @param {{ id: string, name: string, vibe?: string }[]} areas
 */
async function extractWithLLM(content, areas) {
  if (!openaiKey || !content?.trim()) return null;
  const systemPrompt = buildExtractionSystemPrompt(areas);
  const userMessage = `Extract listing data from this Facebook post. Reply with a single JSON object only:\n\n${content.slice(0, 12000)}`;
  const models = [openaiModel, "gpt-4o", "gpt-5", "gpt-4o-mini", "gpt-3.5-turbo"].filter(
    (m, i, arr) => arr.indexOf(m) === i
  );

  for (const model of models) {
    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model,
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
        console.warn(`  OpenAI ${model} error:`, res.status, err.slice(0, 120));
        continue;
      }
      const data = await res.json();
      let text = data?.choices?.[0]?.message?.content;
      if (!text || typeof text !== "string") continue;
      text = text.trim();
      const jsonMatch =
        text.match(/^```(?:json)?\s*([\s\S]*?)```$/m) ||
        text.match(/^```(?:json)?\s*([\s\S]*)$/m);
      const rawJson = jsonMatch ? jsonMatch[1].trim() : text;
      const parsed = JSON.parse(rawJson);
      const areaIds = new Set(areas.map((a) => a.id));
      const fallbackAreaId = areas[0]?.id ?? "other";
      if (model !== openaiModel) console.warn(`  (used fallback model ${model})`);
      return {
        area_id: areaIds.has(parsed.area_id) ? parsed.area_id : fallbackAreaId,
        title: String(parsed.title ?? "").slice(0, 500) || "Imported listing",
        description:
          parsed.description != null ? String(parsed.description).slice(0, 10000) : null,
        price: Math.max(0, Number(parsed.price) || 0),
        price_display:
          String(parsed.price_display ?? "").slice(0, 100) || "Price on request",
        bedrooms: Math.min(99, Math.max(0, Number(parsed.bedrooms) || 1)),
        bathrooms:
          parsed.bathrooms != null && parsed.bathrooms !== ""
            ? Math.min(99, Math.max(0, Number(parsed.bathrooms)))
            : null,
        size_sqm:
          parsed.size_sqm != null && parsed.size_sqm !== ""
            ? Number(parsed.size_sqm)
            : null,
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
        contact_phone: normalizeContactPhone(parsed.contact_phone),
        contact_whatsapp: normalizeContactPhone(parsed.contact_whatsapp),
        contact_email: normalizeContactEmail(parsed.contact_email),
      };
    } catch (e) {
      console.warn(`  LLM ${model} failed:`, e.message);
    }
  }
  return null;
}

async function downloadImage(url, { minBytes = minImageBytes } = {}) {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Referer: "https://www.facebook.com/",
      Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < minBytes || buf.slice(0, 15).toString().includes("<!DOCTYPE")) {
    throw new Error(`too small or not an image (${buf.length} bytes, min ${minBytes})`);
  }
  return buf;
}

/**
 * Download FB profile/logo into apartments storage; fall back to remote URL.
 * @returns {Promise<string|null>}
 */
async function storeCompanyLogo(supabase, facebookId, remoteLogoUrl) {
  if (!remoteLogoUrl) return null;
  try {
    const buf = await downloadImage(remoteLogoUrl, { minBytes: 3_000 });
    const storagePath = `${facebookId}/logo.jpg`;
    const up = await supabase.storage
      .from("apartments")
      .upload(storagePath, buf, { contentType: "image/jpeg", upsert: true });
    if (up.error) throw up.error;
    const publicUrl = supabase.storage.from("apartments").getPublicUrl(storagePath)
      .data.publicUrl;
    console.log(`  logo stored (${buf.length} bytes)`);
    return publicUrl;
  } catch (e) {
    console.warn("  logo download failed, keeping remote URL:", e.message || e);
    return remoteLogoUrl;
  }
}

async function seed(data) {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error(
      "Missing SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) or SUPABASE_SERVICE_ROLE_KEY in scripts/.secret.local"
    );
    process.exit(1);
  }

  const company = data.company || {};
  let facebookId = company.facebookId;
  if (!facebookId && company.pageUrl) {
    facebookId =
      company.pageUrl.match(/\/user\/(\d+)/)?.[1] ||
      company.pageUrl.match(/[?&]id=(\d+)/)?.[1] ||
      null;
  }
  if (!facebookId) {
    console.error(
      "Could not determine facebook_id from the page. Open a /groups/.../user/<id> or profile.php?id= URL."
    );
    process.exit(1);
  }

  const supabase = createClient(url, key);

  const { data: areasList, error: areasError } = await supabase
    .from("areas")
    .select("id, name, vibe");
  if (areasError) {
    console.error("Failed to fetch areas:", areasError.message);
    process.exit(1);
  }
  const areas = Array.isArray(areasList) ? areasList : [];
  if (!areas.length) {
    console.error("No areas in database. Seed areas first.");
    process.exit(1);
  }
  const defaultAreaId =
    areaArg && areas.some((a) => a.id === areaArg) ? areaArg : areas[0].id;
  if (areaArg && defaultAreaId !== areaArg) {
    console.error("Area not found:", areaArg);
    console.error("Valid area_id values:", areas.map((a) => a.id).join(", "));
    process.exit(1);
  }

  const useLlm = Boolean(openaiKey) && !skipLlm;
  if (useLlm) {
    console.log(`Using OpenAI (${openaiModel}) to structure each listing.`);
  } else if (!openaiKey) {
    console.warn(
      "No OPENAI_API_KEY — using regex fields. Add key to scripts/.secret.local for better titles/areas."
    );
  } else {
    console.log("LLM skipped (--no-llm).");
  }

  const companyPayload = {
    facebook_id: String(facebookId),
    name: String(company.name || `FB Partner – ${facebookId}`).slice(0, 500),
    page_url: company.pageUrl || null,
    updated_at: new Date().toISOString(),
  };

  const { error: ecError } = await supabase.from("estate_companies").upsert(companyPayload, {
    onConflict: "facebook_id",
    ignoreDuplicates: false,
  });
  if (ecError) {
    console.error("Estate company upsert error:", ecError.message);
    process.exit(1);
  }

  const { data: ecRow, error: ecFetchErr } = await supabase
    .from("estate_companies")
    .select(
      "id, name, facebook_id, logo_url, contact_phone, contact_whatsapp, contact_email"
    )
    .eq("facebook_id", companyPayload.facebook_id)
    .single();
  if (ecFetchErr || !ecRow) {
    console.error("Failed to load estate company after upsert:", ecFetchErr?.message);
    process.exit(1);
  }

  console.log(`Company: ${ecRow.name} (${ecRow.id}) facebook_id=${ecRow.facebook_id}`);

  let inserted = 0;
  let skipped = 0;
  const posts = Array.isArray(data.posts) ? data.posts : [];
  const contactHints = {
    phone: null,
    whatsapp: null,
    email: null,
  };

  for (const post of posts) {
    const content = post.text || "";
    const permalink = normalizePermalink(post.permalink);
    const sourcePostId = post.postId ? String(post.postId) : `chrome-${postHash(post)}`;

    let existing = null;
    if (permalink) {
      const { data: byUrl } = await supabase
        .from("apartments")
        .select("id")
        .eq("source_url", permalink)
        .maybeSingle();
      existing = byUrl;
    }
    if (!existing) {
      const { data: byPostId } = await supabase
        .from("apartments")
        .select("id")
        .eq("source_post_id", sourcePostId)
        .maybeSingle();
      existing = byPostId;
    }
    if (existing) {
      skipped += 1;
      console.log("  skip duplicate:", extractTitle(content).slice(0, 60));
      // Still mine contact from skipped posts so company profile can fill in.
      const regexContact = extractContactFromText(content);
      contactHints.phone = firstNonEmpty(contactHints.phone, regexContact.contact_phone);
      contactHints.whatsapp = firstNonEmpty(
        contactHints.whatsapp,
        regexContact.contact_whatsapp
      );
      contactHints.email = firstNonEmpty(contactHints.email, regexContact.contact_email);
      continue;
    }

    const hash = postHash(post);
    const imageUrls = Array.isArray(post.images) ? post.images.slice(0, maxImages) : [];
    const stored = [];
    for (let i = 0; i < imageUrls.length; i++) {
      try {
        const buf = await downloadImage(imageUrls[i]);
        const storagePath = `${facebookId}/${hash}/${i}.jpg`;
        const up = await supabase.storage
          .from("apartments")
          .upload(storagePath, buf, { contentType: "image/jpeg", upsert: true });
        if (up.error) throw up.error;
        stored.push(
          supabase.storage.from("apartments").getPublicUrl(storagePath).data.publicUrl
        );
        console.log(`  image ok ${i + 1}/${imageUrls.length} (${buf.length} bytes)`);
      } catch (e) {
        console.warn(`  image fail ${i}:`, e.message || e);
      }
    }

    let extracted = null;
    if (useLlm) {
      process.stdout.write("  openai… ");
      extracted = await extractWithLLM(content, areas);
      console.log(extracted ? `ok → ${extracted.title.slice(0, 60)}` : "failed, falling back to regex");
      await new Promise((r) => setTimeout(r, 200));
    }

    const regexContact = extractContactFromText(content);
    const contactPhone = firstNonEmpty(extracted?.contact_phone, regexContact.contact_phone);
    const contactWhatsapp = firstNonEmpty(
      extracted?.contact_whatsapp,
      regexContact.contact_whatsapp
    );
    const contactEmail = firstNonEmpty(extracted?.contact_email, regexContact.contact_email);
    contactHints.phone = firstNonEmpty(contactHints.phone, contactPhone);
    contactHints.whatsapp = firstNonEmpty(contactHints.whatsapp, contactWhatsapp);
    contactHints.email = firstNonEmpty(contactHints.email, contactEmail);
    if (contactPhone || contactWhatsapp || contactEmail) {
      console.log(
        `  contact: phone=${contactPhone || "—"} wa=${contactWhatsapp || "—"} email=${contactEmail || "—"}`
      );
    }

    const title = extracted?.title || extractTitle(content);
    const bedrooms = extracted?.bedrooms ?? parseBedrooms(content);
    const bathrooms = extracted?.bathrooms ?? parseBathrooms(content);
    const regexPrice = parsePriceVndToUsd(content);
    const priceUsd = extracted ? extracted.price : regexPrice.priceUsd;
    const priceDisplay = extracted
      ? extracted.price_display
      : regexPrice.priceDisplay || "Price on request";
    const mainImage =
      stored[0] || imageUrls[0] || "https://placehold.co/800x600?text=No+image";

    const row = {
      area_id: extracted?.area_id || defaultAreaId,
      estate_company_id: ecRow.id,
      source_url: permalink,
      source_post_id: sourcePostId,
      title: title.slice(0, 500),
      description: extracted?.description ?? (content.slice(0, 10000) || null),
      price: Math.max(0, priceUsd),
      price_display: priceDisplay || "Price on request",
      price_usd: priceUsd > 0 ? priceUsd : null,
      price_currency: priceUsd > 0 ? "USD" : null,
      price_amount: priceUsd > 0 ? priceUsd : null,
      main_image: mainImage,
      images: stored.length > 1 ? stored.slice(1) : [],
      bedrooms,
      bathrooms,
      size_sqm: extracted?.size_sqm ?? null,
      features: extracted?.features ?? [],
      available_from: extracted?.available_from ?? null,
      min_lease_months: extracted?.min_lease_months ?? null,
      sort_order: 0,
      status,
      last_validity_check: new Date().toISOString(),
    };

    const { error: aptError } = await supabase.from("apartments").insert(row);
    if (aptError) {
      console.error("  apartment insert error:", aptError.message);
      continue;
    }
    inserted += 1;
    console.log("  inserted:", title.slice(0, 70));
  }

  // Refresh company logo from the page avatar, and fill empty contact fields only.
  const logoUrl = company.logoUrl
    ? await storeCompanyLogo(supabase, facebookId, company.logoUrl)
    : null;
  const companyPatch = {
    updated_at: new Date().toISOString(),
  };
  if (logoUrl) companyPatch.logo_url = logoUrl;
  if (!ecRow.contact_phone && contactHints.phone) {
    companyPatch.contact_phone = contactHints.phone;
  }
  if (!ecRow.contact_whatsapp && contactHints.whatsapp) {
    companyPatch.contact_whatsapp = contactHints.whatsapp;
  }
  if (!ecRow.contact_email && contactHints.email) {
    companyPatch.contact_email = contactHints.email;
  }

  if (Object.keys(companyPatch).length > 1) {
    const { error: patchErr } = await supabase
      .from("estate_companies")
      .update(companyPatch)
      .eq("id", ecRow.id);
    if (patchErr) {
      console.warn("Company contact/logo update failed:", patchErr.message);
    } else {
      console.log(
        `Company profile: logo=${companyPatch.logo_url ? "refreshed" : "keep"}, phone=${companyPatch.contact_phone || "—"}, wa=${companyPatch.contact_whatsapp || "—"}, email=${companyPatch.contact_email || "—"}`
      );
    }
  }

  return { company: ecRow, inserted, skipped, posts: posts.length };
}

async function main() {
  if (process.platform !== "darwin") {
    console.error("This script requires macOS + Google Chrome + AppleScript.");
    process.exit(1);
  }

  if (navigateUrl) {
    console.log("Navigating Chrome to", navigateUrl);
    navigateChrome(navigateUrl);
  }

  console.log(
    `Extracting from Chrome tab (match=${matchHint}, limit=${limit}, images=${maxImages}, minBytes=${minImageBytes}, maxScrolls=${scrollCount})…`
  );
  const data = findAndExtract();

  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, JSON.stringify(data, null, 2), "utf8");
  console.log(
    `Wrote ${outPath} — company="${data.company?.name}", facebookId=${data.company?.facebookId}, posts=${data.posts?.length ?? 0}`
  );

  if (dryRun) {
    console.log("Dry run — skipped Supabase seed.");
    return;
  }

  const result = await seed(data);
  console.log(
    `Done. Company ${result.company.name} (${result.company.id}): inserted ${result.inserted}, skipped ${result.skipped} of ${result.posts} posts.`
  );
  console.log("JSON:", outPath);
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
