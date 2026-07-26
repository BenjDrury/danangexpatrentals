/**
 * Strip emails and phone numbers from listing description text
 * so public pages never show agent contact details.
 *
 * Keeps prices, sizes, bedroom counts, and other normal listing numbers.
 */

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

/**
 * Labeled contact chunks through end of clause/line.
 * "Contact: …", "Zalo/WhatsApp: …", "Liên hệ …"
 */
const LABELED_CONTACT_RE =
  /(?:contact|li[eê]n\s*h[eệ]|phone|tel(?:ephone)?|call|mobile|zalo|whats?\s*app|telegram|wa\.me|line)(?:\s*\/\s*(?:zalo|whats?\s*app|telegram|phone|tel|line))*\s*[:\-–—]\s*[^\n|;]*/gi;

/**
 * Vietnam-style phones: +84…, 0xxxxxxxxx, optional spaces/dots/dashes.
 * Avoid matching prices ($1000) by requiring +84 / 84 / leading 0.
 */
const PHONE_RE =
  /(?<![$\d])(?:\+?84|0)(?:[\s.\-]?\d){8,11}(?!\d)/g;

/** "Call 0909…" / "Phone +84…" — remove verb + number together. */
const CALL_PHONE_RE =
  /\b(?:call|phone|tel|text)\s+(?:\+?84|0)(?:[\s.\-]?\d){8,11}(?!\d)/gi;

/** Bare international +CC… when clearly a phone (10–15 digits after +). */
const INTL_PHONE_RE = /(?<![$\d])\+(?:[1-9]\d(?:[\s.\-]?\d){8,14})(?!\d)/g;

/** Soft contact phrasing left after removing an address/number. */
const CONTACT_PHRASE_RE =
  /\b(?:email\s+me\s+at|e-?mail\s+me\s+at|reach\s+me\s+(?:at|on)|call\s+me\s+(?:at|on)|contact\s+me\s+(?:at|on)|contact\s+via(?:\s+(?:zalo|whats?\s*app|telegram|phone|tel|email))?(?:\s+or\s+(?:zalo|whats?\s*app|telegram|phone|tel|email))?(?:\s+at)?|text\s+me\s+(?:at|on)|or\s+call|or\s+email|please\s+contact|li[eê]n\s*h[eệ])\b/gi;

const ORPHAN_CHANNEL_PARENS_RE =
  /\(\s*(?:zalo|whats?\s*app|telegram|wa|phone|tel)(?:\s*[,/&|.…]+[\s]*(?:zalo|whats?\s*app|telegram|wa|phone|tel))*\s*[,.…]*\s*\)/gi;

const ORPHAN_CHANNEL_LIST_RE =
  /\b(?:zalo|whats?\s*app|telegram)(?:\s*[,/&|]|\s+or\s+)(?:zalo|whats?\s*app|telegram|phone|tel)(?:\s+(?:at|on))?\b/gi;

function collapseWhitespace(text: string): string {
  return text
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\.{2,}/g, ".")
    .replace(/,{2,}/g, ",")
    .replace(/[ \t]+([,.;!?])/g, "$1")
    .replace(/([,.;!?]){2,}/g, "$1")
    .replace(/\(\s*\)/g, "")
    .replace(/\s+or\s*[.!,;]?$/i, "")
    .replace(/\s+at\s*[.!,;]?$/i, "")
    .replace(/^[,\s.;]+/, "")
    .replace(/[ \t]+$/gm, "")
    .trim();
}

/**
 * Remove emails and phone/contact details from a listing description.
 * Returns null when the result is empty.
 */
export function sanitizeListingDescription(
  description: string | null | undefined
): string | null {
  if (description == null) return null;
  let text = String(description);
  if (!text.trim()) return null;

  text = text.replace(EMAIL_RE, "");
  text = text.replace(LABELED_CONTACT_RE, "");
  text = text.replace(CALL_PHONE_RE, "");
  text = text.replace(PHONE_RE, "");
  text = text.replace(INTL_PHONE_RE, "");
  text = text.replace(CONTACT_PHRASE_RE, "");
  text = text.replace(ORPHAN_CHANNEL_PARENS_RE, "");
  text = text.replace(ORPHAN_CHANNEL_LIST_RE, "");

  text = collapseWhitespace(text);
  if (!text) return null;
  // Capitalize if we stripped a leading contact clause.
  return text.replace(/^[a-z]/, (ch) => ch.toUpperCase());
}
