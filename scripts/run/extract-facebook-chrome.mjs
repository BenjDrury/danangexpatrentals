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
import { createRequire } from "module";
import { mkdirSync, mkdtempSync, writeFileSync, rmSync, readFileSync } from "fs";
import { dirname, join, resolve } from "path";
import { fileURLToPath } from "url";
import { execFileSync } from "child_process";
import { tmpdir } from "os";

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
      // Facebook virtualizes the feed — we need many small scroll steps so we
      // can capture posts before they leave the DOM (merged across steps).
      Math.min(40, Number(flag("scrolls", String(Math.max(20, limit * 4)))) || Math.max(20, limit * 4))
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

/** Scroll Facebook's virtualized feed (often an inner overflow div, not the window). */
function scrollFeedJs(delta = 550) {
  return `(() => {
  function findFeedScroller() {
    let best = null;
    let bestScore = -1;
    for (const el of document.querySelectorAll("div")) {
      const st = getComputedStyle(el);
      if (!/(auto|scroll)/.test(st.overflowY)) continue;
      if (el.scrollHeight <= el.clientHeight + 100) continue;
      if (el.clientHeight < 220) continue;
      const articles = el.querySelectorAll('[role="article"]').length;
      const score = articles * 5000 + Math.min(el.scrollHeight - el.clientHeight, 50000);
      if (score > bestScore) {
        bestScore = score;
        best = el;
      }
    }
    return best;
  }
  for (const el of document.querySelectorAll('[role="tab"], [role="button"], a, span')) {
    const t = (el.innerText || "").trim();
    if (/^(group posts|posts|bài viết)$/i.test(t)) {
      try { el.click(); } catch (e) {}
    }
  }
  const scroller = findFeedScroller();
  if (scroller) {
    const before = scroller.scrollTop;
    scroller.scrollBy(0, ${Number(delta) || 550});
    window.scrollBy(0, Math.round((${Number(delta) || 550}) * 0.25));
    return "inner:" + Math.round(before) + "->" + Math.round(scroller.scrollTop);
  }
  const before = window.scrollY || 0;
  window.scrollBy(0, ${Number(delta) || 550});
  return "window:" + Math.round(before) + "->" + Math.round(window.scrollY || 0);
})();`;
}

const EXTRACT_JS_PATH = join(__dirname, "lib", "fb-chrome-extract.in.js");

function loadExtractJs() {
  return readFileSync(EXTRACT_JS_PATH, "utf8").replace(/__LIMIT__/g, String(limit));
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

function cleanPartnerName(name) {
  let s = String(name || "").replace(/\s+/g, " ").trim();
  // Strip FB profile chrome that often glues onto the real name.
  for (let i = 0; i < 4; i++) {
    const next = s
      .replace(
        /^(digital creator|recent photos|photos|group posts|posts|bài viết)\s+/gi,
        ""
      )
      .replace(
        /\s+(digital creator|recent photos|photos|group posts|posts|bài viết)\s*$/gi,
        ""
      )
      .trim();
    if (next === s) break;
    s = next;
  }
  return s;
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

function imageUrlKey(url) {
  if (!url) return "";
  return url.match(/\/(\d+_\d+_\d+_n)\./)?.[1] || url.split("?")[0];
}

function runChromeJs(code) {
  const dir = mkdtempSync(join(tmpdir(), "fb-js-"));
  const jsPath = join(dir, "run.js");
  writeFileSync(jsPath, code, "utf8");
  try {
    return runOsascript(`
set jsPath to ${asQuote(jsPath)}
set jsCode to read POSIX file jsPath as «class utf8»
tell application "Google Chrome"
  set t to active tab of front window
  return execute t javascript jsCode
end tell
`);
  } finally {
    try {
      rmSync(dir, { recursive: true, force: true });
    } catch {
      /* ignore */
    }
  }
}

function escapeLightbox() {
  runChromeJs(
    `document.dispatchEvent(new KeyboardEvent('keydown', {key:'Escape', bubbles:true})); true;`
  );
  execFileSync("sleep", ["0.35"]);
}

function collectLightboxUrls() {
  const raw = runChromeJs(`(() => {
  function upgrade(url) {
    return (url || "").replace(/ctp=p\\d+x\\d+/g, "ctp=s2048x2048").replace(/&amp;/g, "&");
  }
  function key(src) {
    const m = src.match(/\\/(\\d+_\\d+_\\d+_n)\\./);
    return m ? m[1] : src.split("?")[0];
  }
  const dialog =
    document.querySelector('[role="dialog"]') ||
    document.querySelector('[aria-label*="Photo viewer"]') ||
    document.querySelector('[aria-label*="Photo"]');
  if (!dialog) return JSON.stringify({ ok: false, urls: [] });
  const urls = [];
  const seen = new Set();
  function add(src) {
    src = upgrade(src);
    if (!src || !/scontent|fbcdn/.test(src)) return;
    if (/s24x24|s32x32|s40x40|s48x48|s50x50|s60x60|s200x200|p160x160|static\\.xx\\.fbcdn|ctp=p\\d+x\\d+|s80x80|s64x64/.test(src)) return;
    const k = key(src);
    if (seen.has(k)) return;
    seen.add(k);
    urls.push(src);
  }
  for (const img of dialog.querySelectorAll("img")) {
    add(img.currentSrc || img.src || "");
    const srcset = img.getAttribute("srcset") || "";
    for (const part of srcset.split(",")) {
      const u = part.trim().split(/\\s+/)[0];
      if (u) add(u);
    }
  }
  return JSON.stringify({ ok: true, urls: urls.slice(0, ${maxImages}) });
})();`);
  if (!raw || raw === "missing value") return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed?.urls) ? parsed.urls : [];
  } catch {
    return [];
  }
}

function findCardDomHelpersJs() {
  return `
  function visibleText(root) {
    if (!root) return "";
    const parts = [];
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const el = node.parentElement;
        if (!el) return NodeFilter.FILTER_REJECT;
        if (el.closest('[aria-hidden="true"], [hidden], style, script')) return NodeFilter.FILTER_REJECT;
        const t = (node.nodeValue || "").replace(/\\s+/g, " ").trim();
        if (!t || t.length === 1) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    while (walker.nextNode()) parts.push(walker.currentNode.nodeValue.replace(/\\s+/g, " ").trim());
    return parts.join(" ").replace(/\\s+/g, " ").trim();
  }
  function cardKeyFromRaw(raw) {
    let body = (raw || "").replace(/\\s+/g, " ").trim();
    body = body.replace(/^[\\s\\S]{0,140}?posted to\\s+.+?(?:·|:|\\.)\\s*/i, "");
    body = body.replace(/^Shared with Public group\\s*/i, "");
    return body.toLowerCase().replace(/[^a-z0-9à-ỹ\\s]/gi, " ").replace(/\\s+/g, " ").trim().slice(0, 120);
  }
  function bodyFromCard(raw) {
    let body = (raw || "").replace(/\\s+/g, " ").trim();
    body = body.replace(/^[\\s\\S]{0,140}?posted to\\s+.+?(?:·|:|\\.)\\s*/i, "");
    body = body.replace(/^Shared with Public group\\s*/i, "");
    body = body.replace(/\\s*\\+\\d+\\s*$/, "").trim();
    // Drop trailing FB chrome after the listing body.
    body = body.replace(/\\s*Contact:.*$/i, (m, offset) => {
      // Keep contact line if it includes the price just before — strip only messenger junk after phone.
      return m;
    });
    body = body.replace(/\\s*\\+[0-9a-z]{4,}.*$/i, "").trim();
    body = body.replace(/\\s*Photos from .+?$/i, "").trim();
    return body.slice(0, 5000);
  }
  function listingImgs(root) {
    return [...root.querySelectorAll("img")].filter((img) => {
      const s = img.currentSrc || img.src || "";
      if (!/scontent|fbcdn/.test(s)) return false;
      if (/s24x24|s32x32|s40x40|s48x48|s50x50|s60x60|p160x160|static\\.xx\\.fbcdn/.test(s)) return false;
      return (img.naturalWidth || 0) >= 80 || (img.naturalWidth || 0) === 0;
    });
  }
  function findCardEl(want) {
    const needle = (want || "").replace(/\\*+/g, " ").trim();
    const tip = needle.slice(0, 36);
    const starts = [];
    const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (tw.nextNode()) {
      const v = tw.currentNode.nodeValue || "";
      if (/posted to/i.test(v) || (tip.length >= 12 && v.toLowerCase().includes(tip.slice(0, 18)))) {
        starts.push(tw.currentNode);
      }
    }
    for (const node of starts) {
      let el = node.parentElement;
      let best = null;
      for (let i = 0; i < 28 && el; i++) {
        const raw = visibleText(el);
        const posted = (raw.match(/\\sposted to\\s/gi) || []).length;
        const rawLow = raw.toLowerCase();
        const looksLikeWant =
          tip.length >= 12 && rawLow.includes(tip.slice(0, 24).toLowerCase());
        if (
          raw.length >= 40 &&
          raw.length <= 8000 &&
          (posted === 1 || looksLikeWant)
        ) {
          best = el;
          if (listingImgs(el).length >= 1 && (looksLikeWant || raw.length >= 160)) break;
        }
        el = el.parentElement;
      }
      if (!best) continue;
      const key = cardKeyFromRaw(visibleText(best));
      const rawLow = visibleText(best).toLowerCase();
      if (
        key === want ||
        key.startsWith(want.slice(0, 50)) ||
        want.startsWith(key.slice(0, 50)) ||
        (tip.length >= 12 && rawLow.includes(tip.slice(0, 24).toLowerCase()))
      ) {
        return best;
      }
    }
    return null;
  }
  function clickSeeMore(card) {
    let n = 0;
    const nodes = [...card.querySelectorAll('[role="button"], div[tabindex="0"], span')];
    for (const el of nodes) {
      const t = (el.innerText || "").replace(/\\s+/g, " ").trim();
      if (
        /^(see more|xem thêm|read more|xem tiếp)$/i.test(t) ||
        /…\\s*(see more|xem thêm)/i.test(t) ||
        /\\.\\.\\.\\s*(see more|xem thêm)/i.test(t)
      ) {
        try { el.click(); n++; } catch (e) {}
      }
    }
    return n;
  }
`;
}

/** Expand "See more" on a card (DOM updates async — caller must sleep after). */
function expandCardSeeMore(cardKey) {
  return runChromeJs(`(() => {
  ${findCardDomHelpersJs()}
  const want = ${JSON.stringify(cardKey)};
  const card = findCardEl(want);
  if (!card) return "no-card";
  card.scrollIntoView({ block: "center", behavior: "instant" });
  const n = clickSeeMore(card);
  return "expanded:" + n;
})();`);
}

/** Re-read full card text after See more has expanded. */
function readCardText(cardKey) {
  const raw = runChromeJs(`(() => {
  ${findCardDomHelpersJs()}
  const want = ${JSON.stringify(cardKey)};
  const card = findCardEl(want);
  if (!card) return JSON.stringify({ ok: false });
  const raw = visibleText(card);
  return JSON.stringify({ ok: true, text: bodyFromCard(raw), key: cardKeyFromRaw(raw) });
})();`);
  if (!raw || raw === "missing value") return null;
  try {
    const parsed = JSON.parse(raw);
    return parsed?.ok ? parsed.text : null;
  } catch {
    return null;
  }
}

function openCardPhotos(cardKey) {
  return runChromeJs(`(() => {
  ${findCardDomHelpersJs()}
  const want = ${JSON.stringify(cardKey)};
  const card = findCardEl(want);
  if (!card) return "no-card";
  card.scrollIntoView({ block: "center", behavior: "instant" });
  clickSeeMore(card);
  const controls = [...card.querySelectorAll('[role="button"], a, div[tabindex="0"]')];
  for (const el of controls) {
    const label = ((el.getAttribute("aria-label") || "") + " " + (el.innerText || "")).trim();
    if (/\\d+\\s*(photos?|ảnh)/i.test(label) || /^see all photos$/i.test(label)) {
      try { el.click(); return "opened-photos-btn"; } catch (e) {}
    }
  }
  const imgs = listingImgs(card);
  imgs.sort((a, b) => (b.naturalWidth * b.naturalHeight) - (a.naturalWidth * a.naturalHeight));
  if (!imgs.length) return "no-photo";
  try {
    const wrap = imgs[0].closest('a, [role="button"], [tabindex]');
    if (wrap) { wrap.click(); return "opened-tile-wrap"; }
    imgs[0].click();
    return "opened-tile";
  } catch (e) {
    return "click-fail";
  }
})();`);
}

function harvestCardAlbum() {
  const urls = [];
  const seen = new Set();
  const addAll = (batch) => {
    for (const u of batch || []) {
      const k = imageUrlKey(u);
      if (!k || seen.has(k)) continue;
      seen.add(k);
      urls.push(u);
    }
  };
  execFileSync("sleep", ["0.7"]);
  addAll(collectLightboxUrls());
  if (!urls.length) return urls;
  for (let step = 0; step < Math.min(maxImages, 16); step++) {
    const stepped = runChromeJs(`(() => {
  const n = document.querySelector('[role="dialog"] [aria-label="Next"], [role="dialog"] [aria-label="Next photo"]');
  if (n) { n.click(); return "ok"; }
  return "no";
})();`);
    if (stepped === "no") break;
    execFileSync("sleep", ["0.28"]);
    addAll(collectLightboxUrls());
    if (urls.length >= maxImages) break;
  }
  escapeLightbox();
  return urls.slice(0, maxImages);
}

/**
 * Simple card loop:
 *   scroll feed → for each visible contribution card → read text →
 *   click that card's photo button → page through album → next card.
 */
function findAndExtract() {
  const tmp = mkdtempSync(join(tmpdir(), "fb-extract-"));
  const jsPath = join(tmp, "extract.js");
  writeFileSync(jsPath, loadExtractJs(), "utf8");

  try {
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
    execFileSync("sleep", ["0.8"]);
    runChromeJs(`(() => {
  for (const el of document.querySelectorAll('[role="tab"], [role="button"], a, span')) {
    const t = (el.innerText || "").trim();
    if (/^(group posts|posts|bài viết)$/i.test(t)) { try { el.click(); } catch (e) {} }
  }
  return true;
})();`);
    execFileSync("sleep", ["0.6"]);

    /** @type {any} */
    let company = null;
    /** @type {any[]} */
    const posts = [];
    const seenKeys = new Set();
    let stagnant = 0;

    for (let step = 0; step <= scrollCount; step++) {
      if (step > 0) {
        const scrollHow = runChromeJs(scrollFeedJs(600));
        execFileSync("sleep", ["0.65"]);
        if (step === 1 || step % 4 === 0) {
          console.log(`  scroll ${step}: ${scrollHow || "?"}`);
        }
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
        console.warn(`  feed step ${step}: empty`);
        stagnant += 1;
        continue;
      }
      let data;
      try {
        data = JSON.parse(raw);
      } catch {
        console.warn(`  feed step ${step}: bad JSON`);
        stagnant += 1;
        continue;
      }
      if (!company && data.company) company = data.company;

      if (logoOnly) {
        return {
          scrapedAt: data.scrapedAt,
          pageUrl: data.pageUrl,
          company,
          posts: [],
        };
      }

      const cards = Array.isArray(data.cards) ? data.cards : [];
      let gained = 0;
      for (const card of cards) {
        if (posts.length >= limit) break;
        if (!card?.key || seenKeys.has(card.key)) continue;
        seenKeys.add(card.key);
        gained += 1;
        console.log(
          `  card ${posts.length + 1}/${limit}: ${String(card.text || "").slice(0, 64)}`
        );
        // Expand "See more" then re-read — prices live below the fold.
        const expandHow = expandCardSeeMore(card.key);
        execFileSync("sleep", ["0.9"]);
        const fullText = readCardText(card.key) || card.text;
        const priceHint = parsePriceVndToUsd(fullText);
        console.log(
          `    text: ${fullText.length} chars after ${expandHow || "expand"}; price=${priceHint.priceDisplay || "none"}`
        );
        const openHow = openCardPhotos(card.key);
        let images = [];
        if (
          openHow &&
          openHow !== "no-card" &&
          openHow !== "no-photo" &&
          openHow !== "click-fail"
        ) {
          images = harvestCardAlbum();
          console.log(`    photos: ${images.length} (${openHow})`);
        } else {
          console.warn(`    photos: skipped (${openHow || "miss"})`);
          escapeLightbox();
        }
        posts.push({
          text: fullText,
          images,
          permalink: card.permalink || null,
          postId: card.postId || null,
        });
      }

      console.log(
        `  feed step ${step}: visible=${cards.length}, total=${posts.length}/${limit}` +
          (gained ? ` (+${gained})` : "")
      );

      if (posts.length >= limit) break;
      if (gained === 0) stagnant += 1;
      else stagnant = 0;
      if (stagnant >= 8) {
        console.log("  stopping: no new cards after several scrolls");
        break;
      }
    }

    if (!company) throw new Error("Chrome returned empty extract result");
    console.log(`Captured ${posts.length} listing card(s) with per-card photo harvest.`);
    return {
      scrapedAt: new Date().toISOString(),
      pageUrl: company.pageUrl,
      company,
      posts,
    };
  } finally {
    try {
      rmSync(tmp, { recursive: true, force: true });
    } catch {
      /* ignore */
    }
  }
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
  // "8.2 triệu", "8tr", "8 million"
  const millionMatch = normalized.match(
    /(\d+(?:\.\d+)?)\s*(?:million|triệu|tr)\b(?:\s*\/?\s*month)?/i
  );
  if (millionMatch) {
    vnd = parseFloat(millionMatch[1]) * 1_000_000;
  } else {
    // "8200000 VND/month", "8 200 000đ"
    const vndMatch = normalized.match(
      /(\d{6,10})\s*(?:vnd|vnđ|đ|d)\b(?:\s*\/?\s*month)?/i
    );
    if (vndMatch) {
      vnd = parseInt(vndMatch[1], 10);
    } else {
      const usdMatch = normalized.match(/\$\s*(\d[\d.]*)/);
      if (usdMatch) {
        const usd = Math.round(parseFloat(usdMatch[1]));
        return { priceUsd: usd, priceDisplay: `~$${usd}/month` };
      }
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
  "property_type": "<apartment|house|villa|serviced>",
  "contact_phone": "<string or null>",
  "contact_whatsapp": "<string or null>",
  "contact_email": "<string or null>"
}

AREAS (area_id must be exactly one of these ids):
${areaList}
If the post mentions a ward/area not listed, choose the closest match or use "other".

FIELD RULES:
- title: Short, clear English for expats. E.g. "3BR furnished house near Dragon Bridge" or "Studio near My Khe beach". Max 120 characters. Do not paste raw Vietnamese marketing headers like "NCC - CHO THUÊ…" — translate/summarize.
- description: Clear English summary for expats. Keep location, price, rooms, and key amenities. Do NOT include phone numbers, emails, Zalo, WhatsApp, or other contact details — those belong in contact_* fields only. You may keep original Vietnamese phrases in parentheses when helpful.
- price: Monthly rent in USD. Convert from VND using ${vndToUsd} VND = 1 USD. Integer. Use 0 only if no price given. Prices often appear as "8,200,000 VND/month", "8.2 triệu", or "8tr/tháng" after the post is expanded — always extract them when present.
- price_display: e.g. "~$328/month". Only use "Price on request" when the post truly has no rent amount.
- bedrooms, bathrooms: Integers; bathrooms null if unknown.
- features: lowercase short phrases: furnished, balcony, parking, near beach, wifi, air conditioning, etc.
- available_from / min_lease_months: only when stated; else null.
- property_type: one of apartment, house, villa, serviced. Use villa for villas/biệt thự; house for houses/townhouses/nhà; serviced for serviced apartments; apartment for condo/studio/căn hộ/flat. Default apartment when unclear.
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
        description: sanitizeListingDescription(
          parsed.description != null ? String(parsed.description).slice(0, 10000) : null
        ),
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
        property_type: parsePropertyType(parsed.property_type),
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

  let areas = [];
  let defaultAreaId = null;
  let useLlm = false;

  if (!logoOnly) {
    const { data: areasList, error: areasError } = await supabase
      .from("areas")
      .select("id, name, vibe");
    if (areasError) {
      console.error("Failed to fetch areas:", areasError.message);
      process.exit(1);
    }
    areas = Array.isArray(areasList) ? areasList : [];
    if (!areas.length) {
      console.error("No areas in database. Seed areas first.");
      process.exit(1);
    }
    defaultAreaId =
      areaArg && areas.some((a) => a.id === areaArg) ? areaArg : areas[0].id;
    if (areaArg && defaultAreaId !== areaArg) {
      console.error("Area not found:", areaArg);
      console.error("Valid area_id values:", areas.map((a) => a.id).join(", "));
      process.exit(1);
    }

    useLlm = Boolean(openaiKey) && !skipLlm;
    if (useLlm) {
      console.log(`Using OpenAI (${openaiModel}) to structure each listing.`);
    } else if (!openaiKey) {
      console.warn(
        "No OPENAI_API_KEY — using regex fields. Add key to scripts/.secret.local for better titles/areas."
      );
    } else {
      console.log("LLM skipped (--no-llm).");
    }
  }

  const companyPayload = {
    facebook_id: String(facebookId),
    name: cleanPartnerName(company.name || `FB Partner – ${facebookId}`).slice(0, 500) ||
      `FB Partner – ${facebookId}`,
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

  if (logoOnly) {
    const logoUrl = company.logoUrl
      ? await storeCompanyLogo(supabase, facebookId, company.logoUrl)
      : null;
    if (!logoUrl) {
      console.warn("No logo URL found on page — company logo unchanged.");
      return { company: ecRow, inserted: 0, skipped: 0, posts: 0 };
    }
    const { error: patchErr } = await supabase
      .from("estate_companies")
      .update({ logo_url: logoUrl, updated_at: new Date().toISOString() })
      .eq("id", ecRow.id);
    if (patchErr) {
      console.error("Logo update failed:", patchErr.message);
      process.exit(1);
    }
    console.log("Company logo refreshed:", logoUrl);
    return { company: { ...ecRow, logo_url: logoUrl }, inserted: 0, skipped: 0, posts: 0 };
  }

  let inserted = 0;
  let skipped = 0;
  const posts = Array.isArray(data.posts) ? data.posts : [];
  /** Content hashes already uploaded for this company in this run. */
  const usedImageContentHashes = new Set();
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
      // Backfill photos when we previously saved a text-only draft.
      const imageUrls = Array.isArray(post.images) ? post.images.slice(0, maxImages) : [];
      if (imageUrls.length) {
        const { data: aptRow } = await supabase
          .from("apartments")
          .select("id, images, main_image")
          .eq("id", existing.id)
          .maybeSingle();
        const have = Array.isArray(aptRow?.images) ? aptRow.images.length : 0;
        if (have < 2) {
          const hash = postHash(post);
          const stored = [];
          for (let i = 0; i < imageUrls.length; i++) {
            try {
              const buf = await downloadImage(imageUrls[i]);
              const contentHash = createHash("sha1").update(buf).digest("hex");
              if (usedImageContentHashes.has(contentHash)) continue;
              const storagePath = `${facebookId}/${hash}/bf-${i}.jpg`;
              const up = await supabase.storage
                .from("apartments")
                .upload(storagePath, buf, {
                  contentType: "image/jpeg",
                  upsert: true,
                });
              if (up.error) throw up.error;
              usedImageContentHashes.add(contentHash);
              stored.push(
                supabase.storage.from("apartments").getPublicUrl(storagePath)
                  .data.publicUrl
              );
            } catch (e) {
              console.warn(`  backfill image fail ${i}:`, e.message || e);
            }
          }
          if (stored.length) {
            const { error: imgErr } = await supabase
              .from("apartments")
              .update({
                images: stored,
                main_image: stored[0],
                updated_at: new Date().toISOString(),
              })
              .eq("id", existing.id);
            if (imgErr) {
              console.warn("  image backfill failed:", imgErr.message);
            } else {
              console.log(
                `  backfilled ${stored.length} photos:`,
                extractTitle(content).slice(0, 50)
              );
            }
          }
        }
      }
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
        const contentHash = createHash("sha1").update(buf).digest("hex");
        if (usedImageContentHashes.has(contentHash)) {
          console.warn(
            `  image skip ${i}: already used by an earlier listing in this scrape`
          );
          continue;
        }
        const storagePath = `${facebookId}/${hash}/${i}.jpg`;
        const up = await supabase.storage
          .from("apartments")
          .upload(storagePath, buf, { contentType: "image/jpeg", upsert: true });
        if (up.error) throw up.error;
        usedImageContentHashes.add(contentHash);
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
      description: sanitizeListingDescription(
        extracted?.description ?? (content.slice(0, 10000) || null)
      ),
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
      property_type:
        extracted?.property_type ||
        inferPropertyType(title, extracted?.description ?? content),
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
    logoOnly
      ? `Extracting company logo only (match=${matchHint})…`
      : `Extracting from Chrome tab (match=${matchHint}, limit=${limit}, images=${maxImages}, minBytes=${minImageBytes}, maxScrolls=${scrollCount})…`
  );
  const data = findAndExtract();

  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, JSON.stringify(data, null, 2), "utf8");
  console.log(
    `Wrote ${outPath} — company="${data.company?.name}", facebookId=${data.company?.facebookId}, logo=${data.company?.logoUrl ? "yes" : "no"}, posts=${data.posts?.length ?? 0}`
  );

  if (dryRun) {
    console.log("Dry run — skipped Supabase seed.");
    return;
  }

  const result = await seed(data);
  if (logoOnly) {
    console.log(`Done. Logo refreshed for ${result.company.name} (${result.company.id}).`);
  } else {
    console.log(
      `Done. Company ${result.company.name} (${result.company.id}): inserted ${result.inserted}, skipped ${result.skipped} of ${result.posts} posts.`
    );
  }
  console.log("JSON:", outPath);
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
