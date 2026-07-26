import type { Lead } from "@/lib/data/leads";
import { apartmentPublicUrl } from "@/lib/contact-links";

export type OutreachApartment = {
  id: string;
  area_id: string;
  title: string;
  price: number;
  price_display: string;
  public_slug: string | null;
  created_at: string;
  status: string | null;
};

export type OutreachArea = {
  id: string;
  name: string;
};

export type OutreachDraft = {
  subject: string;
  body: string;
};

function formatPrice(apt: OutreachApartment): string {
  const display = apt.price_display?.trim();
  if (display) return display;
  if (Number.isFinite(apt.price) && apt.price > 0) {
    return `$${Math.round(apt.price).toLocaleString("en-US")}/mo`;
  }
  return "Price on request";
}

function areaName(
  areaId: string,
  areasById: Map<string, string>
): string {
  return areasById.get(areaId) ?? areaId;
}

/** Pull numeric budget bounds from free-text like "$300–500", "under 800", "500+". */
export function parseBudgetRange(
  text: string | null | undefined
): { min?: number; max?: number } {
  if (!text?.trim()) return {};
  const nums = [...text.matchAll(/(\d[\d,]*)/g)]
    .map((m) => Number(m[1].replace(/,/g, "")))
    .filter((n) => Number.isFinite(n) && n > 0);
  if (nums.length === 0) return {};

  const lower = text.toLowerCase();
  if (/(under|below|max|up to|<=|<)/.test(lower)) {
    return { max: Math.max(...nums) };
  }
  if (/(over|above|min|from|at least|>=|>|\+)/.test(lower) && nums.length === 1) {
    return { min: nums[0] };
  }
  if (nums.length === 1) {
    const n = nums[0];
    return { min: Math.round(n * 0.75), max: Math.round(n * 1.25) };
  }
  return { min: Math.min(...nums), max: Math.max(...nums) };
}

function normalizeAreaToken(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Match free-text preferred area / area_id against known neighbourhoods. */
export function matchAreaIds(
  lead: Pick<Lead, "preferred_area" | "area_id">,
  areas: OutreachArea[]
): string[] {
  const ids = new Set<string>();
  if (lead.area_id && areas.some((a) => a.id === lead.area_id)) {
    ids.add(lead.area_id);
  }

  const preferred = normalizeAreaToken(lead.preferred_area ?? "");
  if (!preferred) return [...ids];

  for (const area of areas) {
    const name = normalizeAreaToken(area.name);
    const id = normalizeAreaToken(area.id);
    if (
      preferred.includes(name) ||
      name.includes(preferred) ||
      preferred.includes(id) ||
      id.includes(preferred)
    ) {
      ids.add(area.id);
    }
  }
  return [...ids];
}

function isAvailable(apt: OutreachApartment): boolean {
  return apt.status == null || apt.status === "available";
}

/**
 * Prefer available listings matching area + budget; fill up to `limit`
 * with other recent available homes if needed.
 */
export function pickListingsForLead(
  lead: Lead,
  apartments: OutreachApartment[],
  areas: OutreachArea[],
  limit = 5
): OutreachApartment[] {
  const available = apartments
    .filter(isAvailable)
    .slice()
    .sort((a, b) => {
      const ta = Date.parse(a.created_at) || 0;
      const tb = Date.parse(b.created_at) || 0;
      return tb - ta;
    });

  const areaIds = matchAreaIds(lead, areas);
  const budget = parseBudgetRange(lead.budget_range);

  const scored = available.map((apt) => {
    let score = 0;
    if (areaIds.length > 0 && areaIds.includes(apt.area_id)) score += 4;
    if (budget.min != null || budget.max != null) {
      const price = apt.price;
      if (Number.isFinite(price) && price > 0) {
        const minOk = budget.min == null || price >= budget.min;
        const maxOk = budget.max == null || price <= budget.max;
        if (minOk && maxOk) score += 3;
        else score -= 2;
      }
    }
    return { apt, score };
  });

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return (Date.parse(b.apt.created_at) || 0) - (Date.parse(a.apt.created_at) || 0);
  });

  const picked: OutreachApartment[] = [];
  const seen = new Set<string>();

  for (const { apt, score } of scored) {
    if (picked.length >= limit) break;
    if (score < 0 && picked.length > 0) continue;
    if (seen.has(apt.id)) continue;
    seen.add(apt.id);
    picked.push(apt);
  }

  if (picked.length < limit) {
    for (const apt of available) {
      if (picked.length >= limit) break;
      if (seen.has(apt.id)) continue;
      seen.add(apt.id);
      picked.push(apt);
    }
  }

  return picked;
}

function leadContextLines(lead: Lead): string[] {
  const lines: string[] = [];
  if (lead.budget_range?.trim()) lines.push(`Budget: ${lead.budget_range.trim()}`);
  if (lead.preferred_area?.trim()) lines.push(`Area: ${lead.preferred_area.trim()}`);
  if (lead.move_date?.trim()) lines.push(`Move: ${lead.move_date.trim()}`);
  if (lead.length_of_stay?.trim()) lines.push(`Stay: ${lead.length_of_stay.trim()}`);
  return lines;
}

function listingLines(
  listings: OutreachApartment[],
  areasById: Map<string, string>
): string[] {
  return listings.map((apt, i) => {
    const url = apartmentPublicUrl(apt.id, apt.public_slug);
    const where = areaName(apt.area_id, areasById);
    return `${i + 1}. ${apt.title} — ${formatPrice(apt)} — ${where}\n${url}`;
  });
}

export function buildLeadOutreach(
  lead: Lead,
  apartments: OutreachApartment[],
  areas: OutreachArea[]
): OutreachDraft {
  const areasById = new Map(areas.map((a) => [a.id, a.name]));

  if (lead.apartment_id) {
    const listing = apartments.find((a) => a.id === lead.apartment_id);
    const title = listing?.title?.trim() || "that apartment";
    const url = listing
      ? apartmentPublicUrl(listing.id, listing.public_slug)
      : null;

    const body = [
      `Hi! Thanks for your interest in "${title}" on Da Nang Expat Rentals.`,
      "",
      "We're speaking with the realtor now so they can get in touch with you shortly. We'll follow up here as soon as we hear back.",
      url ? `\nListing: ${url}` : null,
      "",
      "If you have timing, budget, or viewing preferences to add in the meantime, just reply here.",
    ]
      .filter((line) => line != null)
      .join("\n");

    return {
      subject: `Re: ${listing?.title?.trim() || "your Da Nang apartment inquiry"}`,
      body,
    };
  }

  const matches = pickListingsForLead(lead, apartments, areas, 5);
  const context = leadContextLines(lead);
  const bodyParts = [
    "Hi! Thanks for reaching out about a place in Da Nang.",
    "",
  ];

  if (context.length > 0) {
    bodyParts.push("Based on what you shared:");
    bodyParts.push(...context.map((l) => `• ${l}`));
    bodyParts.push("");
  }

  if (matches.length > 0) {
    bodyParts.push("Here are a few recent listings that look like a fit:");
    bodyParts.push("");
    bodyParts.push(...listingLines(matches, areasById));
    bodyParts.push("");
    bodyParts.push(
      "Happy to refine these or line up viewings — just reply with what jumps out."
    );
  } else {
    bodyParts.push(
      "We're pulling a shortlist based on your preferences and will follow up shortly with options."
    );
  }

  return {
    subject: "Da Nang apartment options for you",
    body: bodyParts.join("\n"),
  };
}

export function buildPartnerApplicationOutreach(app: {
  name: string;
  company_name: string | null;
  areas: string | null;
}): OutreachDraft {
  const firstName = app.name.trim().split(/\s+/)[0] || app.name.trim() || "there";
  const body = [
    `Hi ${firstName}! Thanks for applying to partner with Da Nang Expat Rentals.`,
    "",
    "We've received your application and will review it shortly.",
    app.company_name?.trim()
      ? `Noted you're with ${app.company_name.trim()}.`
      : null,
    app.areas?.trim() ? `Areas mentioned: ${app.areas.trim()}.` : null,
    "",
    "If you already have listing photos, Facebook pages, or inventory notes ready, feel free to reply here — it helps us get you set up faster.",
    "",
    "Looking forward to working together.",
  ]
    .filter((line) => line != null)
    .join("\n");

  return {
    subject: "Thanks for applying — Da Nang Expat Rentals partners",
    body,
  };
}
