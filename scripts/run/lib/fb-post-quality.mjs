/**
 * Shared quality / dedupe checks for Facebook listing imports.
 * Used by extract-facebook-chrome before lightbox + DB seed.
 */

const STOPWORDS = new Set([
  "the",
  "and",
  "for",
  "with",
  "near",
  "from",
  "this",
  "that",
  "are",
  "was",
  "have",
  "has",
  "can",
  "you",
  "your",
  "our",
  "into",
  "only",
  "just",
  "all",
  "also",
  "month",
  "months",
  "daily",
  "available",
  "contact",
  "schedule",
  "viewing",
  "messenger",
  "facebook",
  "zalo",
  "whatsapp",
  "phone",
  "email",
  "vnd",
  "usd",
  "price",
  "rental",
  "rent",
  "apartment",
  "apartments",
  "house",
  "houses",
  "villa",
  "villas",
  "hotel",
  "fully",
  "furnished",
  "modern",
  "private",
  "spacious",
  "ideal",
  "choice",
  "professionals",
  "workers",
  "digital",
  "nomads",
  "expatriates",
  "looking",
  "seeking",
  "living",
  "space",
  "location",
  "street",
  "district",
  "beach",
  "city",
  "center",
  "centre",
  "close",
  "minutes",
  "highlights",
  "amenities",
  "negotiable",
  "contracts",
  "contract",
  "service",
  "electricity",
  "water",
  "wifi",
  "air",
  "conditioning",
  "kitchen",
  "washing",
  "machine",
  "elevator",
  "secure",
  "building",
  "support",
  "team",
  "needed",
  "move",
  "august",
  "ready",
  "welcome",
  "guests",
  "danang",
  "nang",
  "son",
  "tra",
  "hoi",
  "expats",
  "posted",
  "group",
  "groups",
  "less",
  "more",
  "translation",
  "hide",
  "original",
  "cho",
  "thuê",
  "thue",
  "căn",
  "can",
  "hộ",
  "ho",
  "phòng",
  "phong",
  "giá",
  "gia",
  "triệu",
  "trieu",
  "liên",
  "lien",
  "hệ",
  "he",
  "đà",
  "da",
]);

/** Comment / share activity — not an original listing post. */
export function isCommentOrShareActivity(text) {
  if (!text) return false;
  return (
    /\bcommented on\b/i.test(text) ||
    /\bđã bình luận về bài viết của\b/i.test(text) ||
    /\breplied to\b.+\bcomment\b/i.test(text) ||
    /\bshared (a|an|this) (post|link|photo)\b/i.test(text)
  );
}

/**
 * Facebook sometimes renders vertical / RTL text as single-character tokens
 * ("e t n o S s r p…"). Those are not usable listing bodies.
 */
export function isGarbledText(text) {
  if (!text) return true;
  const tokens = text.split(/\s+/).filter(Boolean);
  if (tokens.length < 10) return false;
  const singleLetter = tokens.filter((t) => /^[\p{L}\p{N}]$/u.test(t)).length;
  const readable = tokens.filter((t) => t.length >= 2).length;
  if (singleLetter / tokens.length >= 0.28) return true;
  if (readable / tokens.length < 0.55) return true;
  return false;
}

export function normalizeListingText(text) {
  return String(text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/https?:\/\/\S+/gi, " ")
    .replace(
      /\b(see less|see more|xem thêm|hide translation|see translation|see original|rate this translation|facebook|messenger)\b/gi,
      " "
    )
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Distinctive content tokens for near-duplicate comparison. */
export function listingTokenSet(text) {
  const tokens = normalizeListingText(text)
    .split(" ")
    .filter((t) => t.length >= 3 && !STOPWORDS.has(t));
  return new Set(tokens);
}

export function jaccardSimilarity(a, b) {
  if (!a?.size || !b?.size) return 0;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter += 1;
  return inter / (a.size + b.size - inter);
}

/**
 * Stable-ish fingerprint for the same unit reposted in VN + EN.
 * Prefers unit + building when both exist (language-agnostic).
 */
export function listingDedupeKey(text) {
  const n = normalizeListingText(text);
  const unit =
    n.match(/\b(?:vip|apt|apartment|can ho|căn hộ|phong|room)\s*#?\s*(\d{2,4})\b/) ||
    n.match(/\b(?:unit|can)\s*(\d{2,4})\b/) ||
    n.match(/\b(\d{3})\b(?=.*\b(?:apartment|can ho|btm|hotel)\b)/);
  const building = n.match(
    /\b(btm\s*danang(?:\s*apartment(?:\s*hotel)?)?|muong thanh|novotel|vinpearl|azura|han\s*river)\b/
  );
  const price =
    n.match(/\b(\d+(?:[.,]\d+)?)\s*(?:tr(?:ieu)?5?|million|trieu)\b/) ||
    n.match(/\$\s*(\d{2,5})\b/);
  const street = n.match(
    /\b([a-z]+(?:\s+[a-z]+)?)\s+(?:street|st|duong)\b|\b(?:duong|đường)\s+([a-z]+(?:\s+[a-z]+)?)\b/
  );

  const unitPart = unit?.[1] ? `unit:${unit[1]}` : null;
  const bldgPart = building?.[1]
    ? `bldg:${building[1].replace(/\s+/g, "").slice(0, 24)}`
    : null;

  // Same unit in the same building → one listing, even across languages.
  if (unitPart && bldgPart) return `${unitPart}|${bldgPart}`;

  const parts = [
    unitPart,
    bldgPart,
    price?.[1] ? `price:${String(price[1]).replace(",", ".")}` : null,
    street?.[1] || street?.[2]
      ? `st:${(street[1] || street[2]).replace(/\s+/g, "")}`
      : null,
  ].filter(Boolean);

  if (parts.length >= 2) return parts.join("|");
  return null;
}

/**
 * @param {string} text
 * @param {{ keys: Set<string>, tokenSets: Set<string>[] }} seen
 * @returns {string | null} reject reason, or null if ok
 */
export function rejectPostReason(text, seen = { keys: new Set(), tokenSets: [] }) {
  const body = String(text || "").trim();
  if (body.length < 40) return "too-short";
  if (isCommentOrShareActivity(body)) return "comment-or-share";
  if (isGarbledText(body)) return "garbled-text";

  // Exact-ish fingerprint only — group posts are all apartments; don't drop
  // similar units just because wording overlaps.
  const key = listingDedupeKey(body);
  if (key && seen.keys.has(key)) return "near-duplicate-key";

  const norm = normalizeListingText(body).slice(0, 160);
  if (norm.length >= 40 && seen.keys.has(`text:${norm}`)) return "dup-text";

  return null;
}

/**
 * Filter scraped posts before lightbox / LLM / DB writes.
 * @param {{ text?: string }[]} posts
 * @returns {{ kept: typeof posts, rejected: { reason: string, preview: string }[] }}
 */
export function filterScrapedPosts(posts) {
  const kept = [];
  const rejected = [];
  const seen = { keys: new Set(), tokenSets: [] };

  for (const post of posts || []) {
    const text = post?.text || "";
    const reason = rejectPostReason(text, seen);
    if (reason) {
      rejected.push({
        reason,
        preview: text.replace(/\s+/g, " ").slice(0, 70),
      });
      continue;
    }
    const key = listingDedupeKey(text);
    if (key) seen.keys.add(key);
    const norm = normalizeListingText(text).slice(0, 160);
    if (norm.length >= 40) seen.keys.add(`text:${norm}`);
    kept.push(post);
  }

  return { kept, rejected };
}
