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
 *   node scripts/run/extract-facebook-chrome.mjs --out=tmp_fb/export.json --area=my-khe --status=draft
 *
 * Requires (unless --dry-run): scripts/.secret.local with SUPABASE_URL (or
 * NEXT_PUBLIC_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY.
 * Optional: VND_TO_USD (default 25000).
 */

import { createClient } from "@supabase/supabase-js";
import { createHash } from "crypto";
import { config } from "dotenv";
import { mkdirSync, mkdtempSync, writeFileSync, rmSync } from "fs";
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
const limit = Math.max(1, Math.min(30, Number(flag("limit", "5")) || 5));
const scrollCount = Math.max(2, Math.min(40, Number(flag("scrolls", "20")) || 20));
const status = String(flag("status", "draft") || "draft");
const areaArg = flag("area", null);
const navigateUrl = flag("url", null);
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

/** Browser-side extractor. `__LIMIT__` replaced before write. */
const EXTRACT_JS_TEMPLATE = String.raw`
(() => {
  const limit = __LIMIT__;
  const href = location.href;

  function parseIds(url) {
    const user =
      (url.match(/\/user\/(\d+)/) || url.match(/[?&]id=(\d+)/) || [])[1] || null;
    const group = (url.match(/\/groups\/(\d+)/) || [])[1] || null;
    return { facebookId: user, groupId: group };
  }

  const ids = parseIds(href);
  const BAD_NAMES = /^(notifications?|facebook|menu|home|search|marketplace|watch|friends|groups)$/i;

  // Expand truncated post bodies before scraping
  for (const el of document.querySelectorAll('[role="button"], div[tabindex="0"]')) {
    const t = (el.innerText || "").trim();
    if (/^see more$/i.test(t) || /^xem thêm$/i.test(t)) {
      try { el.click(); } catch (_) {}
    }
  }

  function pickName() {
    const posted = (document.body.innerText || "").match(
      /([A-Za-zÀ-ỹ][A-Za-zÀ-ỹ'’.\- ]{1,60}?)\s+posted to\s+/
    );
    if (posted && posted[1] && !BAD_NAMES.test(posted[1].trim())) {
      return posted[1].trim();
    }
    for (const el of document.querySelectorAll("h1, h2, strong, span")) {
      const t = (el.innerText || "").replace(/\s+/g, " ").trim();
      if (!t || t.length < 2 || t.length > 80) continue;
      if (BAD_NAMES.test(t)) continue;
      if (/unread|notification|message|add friend|view profile|points/i.test(t)) continue;
      if (el.closest('[role="navigation"], [role="banner"], [aria-label*="Notification"]')) continue;
      if (/^h[12]$/i.test(el.tagName) && !BAD_NAMES.test(t)) return t;
    }
    const title = (document.title || "")
      .replace(/\s*[|–—].*$/, "")
      .replace(/\s*-\s*Facebook.*$/i, "")
      .trim();
    if (title && !BAD_NAMES.test(title)) return title;
    return "FB Partner";
  }

  const name = pickName();

  const logoImg = [...document.querySelectorAll("img")].find((el) => {
    const src = el.currentSrc || el.src || "";
    const w = el.naturalWidth || 0;
    return /scontent|fbcdn/.test(src) && w >= 80 && w <= 400 && !/static\.xx\.fbcdn/.test(src);
  });
  const logoUrl = logoImg ? logoImg.currentSrc || logoImg.src : null;

  function isListingImage(src, w) {
    if (!src || !/scontent|fbcdn/.test(src)) return false;
    if (w < 180) return false;
    if (/s24x24|s32x32|s40x40|s48x48|s50x50|s60x60|s200x200|p160x160|emoji|static\.xx\.fbcdn/.test(src))
      return false;
    return true;
  }

  function imageKey(src) {
    const m = src.match(/\/(\d+_\d+_\d+_n)\./);
    return m ? m[1] : src.split("?")[0];
  }

  function collectImages(root, max) {
    if (!root) return [];
    const imgs = [...root.querySelectorAll("img")]
      .map((img) => ({
        src: img.currentSrc || img.src || "",
        w: img.naturalWidth || 0,
        h: img.naturalHeight || 0,
      }))
      .filter((im) => isListingImage(im.src, im.w))
      .sort((a, b) => b.w * b.h - a.w * a.h);
    const seen = new Set();
    const out = [];
    for (const im of imgs) {
      const k = imageKey(im.src);
      if (seen.has(k)) continue;
      seen.add(k);
      out.push(im.src);
      if (out.length >= max) break;
    }
    return out;
  }

  function findPermalink(root) {
    if (!root) return null;
    for (const a of root.querySelectorAll("a[href]")) {
      const h = a.href || "";
      if (/\/permalink\/\d+|\/posts\/\d+|story_fbid=\d+|multi_permalinks=\d+/.test(h)) {
        return h.split("?")[0].replace(/\/$/, "");
      }
    }
    return null;
  }

  function postIdFromUrl(url) {
    if (!url) return null;
    const m =
      url.match(/permalink\/(\d+)/) ||
      url.match(/\/posts\/(\d+)/) ||
      url.match(/story_fbid=(\d+)/) ||
      url.match(/multi_permalinks=(\d+)/);
    return m ? m[1] : null;
  }

  function looksLikeListing(text) {
    if (!text || text.length < 40) return false;
    if (/^(Intro|Group posts|Recent photos|Number of unread)/i.test(text)) return false;
    if (/Member of .+ since /i.test(text) && text.length < 200) return false;
    return /(cho thuê|for rent|bedroom|phòng ngủ|căn hộ|apartment|villa|nhà|giá|triệu|million|\$\d|studio|thuê|kiệt|full (nội thất|furniture)|pn\b)/i.test(
      text
    );
  }

  function cleanPostText(text) {
    return text
      .replace(/Facebook(\s+Facebook)+/g, " ")
      .replace(/Comment as [^\s]+/gi, " ")
      .replace(/See (translation|original)/gi, " ")
      .replace(/Rate this translation/gi, " ")
      .replace(/See more/gi, " ")
      .replace(/All reactions:?/gi, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function findContainerForSnippet(snippet) {
    const needle = snippet.slice(0, 48);
    if (needle.length < 12) return null;
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const v = walker.currentNode.nodeValue || "";
      if (!v.includes(needle.slice(0, 24))) continue;
      let el = walker.currentNode.parentElement;
      let best = null;
      for (let i = 0; i < 20 && el; i++) {
        const block = (el.innerText || "").replace(/\s+/g, " ").trim();
        const imgs = collectImages(el, 8);
        // One post: not the whole feed (avoid multi "posted to")
        const postedCount = (block.match(/\sposted to\s/gi) || []).length;
        if (
          block.length >= 40 &&
          block.length <= 3500 &&
          postedCount <= 1 &&
          (imgs.length >= 1 || looksLikeListing(block))
        ) {
          best = el;
          if (imgs.length >= 2 && postedCount <= 1) break;
        }
        el = el.parentElement;
      }
      if (best) return best;
    }
    return null;
  }

  const posts = [];
  const seenText = new Set();

  function pushPost(rawText, root) {
    if (posts.length >= limit) return false;
    let text = cleanPostText(rawText);
    if (!looksLikeListing(text)) return false;
    let body = text;
    const marker = body.match(/posted to .+?(?:·|:)\s*(.+)$/i);
    if (marker) body = marker[1].trim();
    body = body.replace(
      /^.*?((?:NCC\s*[-–—:]?\s*)?(?:CHO THUÊ|Cho thuê|House for rent|For rent|Bedroom|\d+-Bedroom|Căn hộ).+)$/i,
      "$1"
    );
    if (body.length < 30) body = text;
    // Trim trailing UI
    body = body.replace(/\s*\+\d+\s*$/, "").trim();
    const key = body.slice(0, 100);
    if (seenText.has(key)) return false;
    seenText.add(key);

    let images = collectImages(root, 8);
    let permalink = findPermalink(root);
    if ((!images.length || !permalink) && !root) {
      const found = findContainerForSnippet(body);
      if (found) {
        if (!images.length) images = collectImages(found, 8);
        if (!permalink) permalink = findPermalink(found);
        root = found;
      }
    }

    posts.push({
      text: body.slice(0, 4000),
      images,
      permalink,
      postId: postIdFromUrl(permalink),
    });
    return true;
  }

  // 1) Split whole-page text on "Name posted to" — most reliable for FB group member feeds
  const pageText = (document.body.innerText || "").replace(/\s+/g, " ");
  const splitRe =
    /([A-Za-zÀ-ỹ][A-Za-zÀ-ỹ'’.\- ]{1,60}?)\s+posted to\s+(.+?)(?=(?:[A-Za-zÀ-ỹ][A-Za-zÀ-ỹ'’.\- ]{1,60}?\s+posted to\s+)|$)/gi;
  let m;
  const chunks = [];
  while ((m = splitRe.exec(pageText)) !== null) {
    chunks.push(m[0]);
  }
  for (const chunk of chunks) {
    if (posts.length >= limit) break;
    pushPost(chunk, findContainerForSnippet(chunk.replace(/\s+/g, " ").slice(40, 120)));
  }

  // 2) Individual role=article nodes
  if (posts.length < limit) {
    for (const article of document.querySelectorAll('[role="article"]')) {
      if (posts.length >= limit) break;
      const text = (article.innerText || "").replace(/\s+/g, " ").trim();
      if ((text.match(/\sposted to\s/gi) || []).length > 1) continue;
      pushPost(text, article);
    }
  }

  // 3) Keyword walk fallback
  if (posts.length < limit) {
    const needles = [
      "CHO THUÊ", "Cho thuê", "for rent", "For rent", "House for rent",
      "Bedroom", "phòng ngủ", "triệu", "Giá thuê", "Apartment", "Căn hộ", "NCC",
      "kiệt", "full nội thất", "Full furniture",
    ];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (walker.nextNode() && posts.length < limit) {
      const t = walker.currentNode.nodeValue || "";
      if (!needles.some((k) => t.includes(k))) continue;
      let el = walker.currentNode.parentElement;
      let best = null;
      for (let i = 0; i < 18 && el; i++) {
        const block = (el.innerText || "").replace(/\s+/g, " ").trim();
        const postedCount = (block.match(/\sposted to\s/gi) || []).length;
        const imgs = collectImages(el, 8);
        if (
          imgs.length >= 1 &&
          block.length >= 50 &&
          block.length <= 3500 &&
          postedCount <= 1 &&
          looksLikeListing(block)
        ) {
          best = el;
          break;
        }
        el = el.parentElement;
      }
      if (!best) continue;
      pushPost(best.innerText, best);
    }
  }

  return JSON.stringify({
    scrapedAt: new Date().toISOString(),
    pageUrl: href,
    company: {
      name: name.slice(0, 500),
      facebookId: ids.facebookId,
      groupId: ids.groupId,
      pageUrl: href,
      logoUrl,
    },
    posts,
  });
})();
`;

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
  const extractJs = EXTRACT_JS_TEMPLATE.replace(/__LIMIT__/g, String(limit));
  writeFileSync(jsPath, extractJs, "utf8");

  try {
    const script = `
set jsPath to ${asQuote(jsPath)}
set jsCode to read POSIX file jsPath as «class utf8»

tell application "Google Chrome"
  set matchHint to ${asQuote(matchHint)}
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
  set targetTab to active tab of foundWin

  execute targetTab javascript "window.scrollTo(0, 0); true;"
  delay 0.5
  repeat ${scrollCount} times
    execute targetTab javascript "window.scrollBy(0, 1600); true;"
    delay 0.55
    execute targetTab javascript "
      (() => {
        for (const el of document.querySelectorAll('[role=\\"button\\"], div[tabindex=\\"0\\"]')) {
          const t = (el.innerText || '').trim();
          if (/^see more$/i.test(t) || /^xem thêm$/i.test(t)) {
            try { el.click(); } catch (e) {}
          }
        }
        return true;
      })();
    "
    delay 0.35
  end repeat
  delay 1.0

  set output to execute targetTab javascript jsCode
  return output
end tell
`;

    const raw = runOsascript(script);
    if (!raw) throw new Error("Chrome returned empty extract result");
    try {
      return JSON.parse(raw);
    } catch {
      throw new Error(`Could not parse extract JSON (first 200 chars): ${raw.slice(0, 200)}`);
    }
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

async function downloadImage(url) {
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
  if (buf.length < 3000 || buf.slice(0, 15).toString().includes("<!DOCTYPE")) {
    throw new Error(`not an image (${buf.length} bytes)`);
  }
  return buf;
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

  const { data: areasList, error: areasError } = await supabase.from("areas").select("id, name");
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

  const companyPayload = {
    facebook_id: String(facebookId),
    name: String(company.name || `FB Partner – ${facebookId}`).slice(0, 500),
    page_url: company.pageUrl || null,
    logo_url: company.logoUrl || null,
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
    .select("id, name, facebook_id")
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
      continue;
    }

    const hash = postHash(post);
    const imageUrls = Array.isArray(post.images) ? post.images.slice(0, 8) : [];
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

    const title = extractTitle(content);
    const bedrooms = parseBedrooms(content);
    const bathrooms = parseBathrooms(content);
    const { priceUsd, priceDisplay } = parsePriceVndToUsd(content);
    const mainImage =
      stored[0] || imageUrls[0] || "https://placehold.co/800x600?text=No+image";

    const row = {
      area_id: defaultAreaId,
      estate_company_id: ecRow.id,
      source_url: permalink,
      source_post_id: sourcePostId,
      title: title.slice(0, 500),
      description: content.slice(0, 10000) || null,
      price: Math.max(0, priceUsd),
      price_display: priceDisplay || "Price on request",
      price_usd: priceUsd > 0 ? priceUsd : null,
      price_currency: priceUsd > 0 ? "USD" : null,
      price_amount: priceUsd > 0 ? priceUsd : null,
      main_image: mainImage,
      images: stored.length > 1 ? stored.slice(1) : [],
      bedrooms,
      bathrooms,
      size_sqm: null,
      features: [],
      available_from: null,
      min_lease_months: null,
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
    `Extracting from Chrome tab (match=${matchHint}, limit=${limit}, scrolls=${scrollCount})…`
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
