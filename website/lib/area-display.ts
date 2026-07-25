/** Display helpers for area suitability / lifestyle fields. */

export type IntensityLevel = "low" | "medium" | "high";

const INTENSITY_ALIASES: Record<string, IntensityLevel> = {
  low: "low",
  l: "low",
  quiet: "low",
  light: "low",
  medium: "medium",
  med: "medium",
  mid: "medium",
  moderate: "medium",
  high: "high",
  h: "high",
  strong: "high",
  busy: "high",
};

const INTENSITY_LABEL: Record<IntensityLevel, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

const INTENSITY_STEPS: Record<IntensityLevel, number> = {
  low: 1,
  medium: 2,
  high: 3,
};

const TENANT_PROFILE_LABELS: Record<string, string> = {
  nomad_mixed: "Mixed nomad lifestyle",
  nomad_beach: "Beach nomads",
  family_value_newtown: "Families in newer developments",
  family_local: "Local family living",
  value_professional: "Value-conscious professionals",
  professional_cbd: "CBD professionals",
  value_local: "Budget local living",
  rural_home: "Rural / quieter living",
};

/** Parse low / medium / high (and common aliases). Returns null if not a level word. */
export function parseIntensity(value: string | null | undefined): IntensityLevel | null {
  if (value == null) return null;
  const key = String(value).trim().toLowerCase().replace(/[\s-]+/g, "_");
  if (!key) return null;
  if (INTENSITY_ALIASES[key]) return INTENSITY_ALIASES[key];
  // whole-string match only — don't treat long notes as levels
  const first = key.split(/[^a-z]+/)[0];
  if (key === first && INTENSITY_ALIASES[first]) return INTENSITY_ALIASES[first];
  return null;
}

export function intensityLabel(level: IntensityLevel): string {
  return INTENSITY_LABEL[level];
}

export function intensitySteps(level: IntensityLevel): number {
  return INTENSITY_STEPS[level];
}

/** Human label for tenant_profile_tag enum keys. */
export function formatTenantProfile(tag: string | null | undefined): string | null {
  if (tag == null || String(tag).trim() === "") return null;
  const raw = String(tag).trim();
  const key = raw.toLowerCase().replace(/[\s-]+/g, "_");
  if (TENANT_PROFILE_LABELS[key]) return TENANT_PROFILE_LABELS[key];
  return raw
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Title-case a short phrase for chips / vibe. */
export function titleCasePhrase(s: string): string {
  return s
    .trim()
    .split(/\s+/)
    .map((w) => (w.length <= 2 && w === w.toLowerCase() ? w : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(" ");
}

/**
 * Normalize expat score to 0–10 scale for meters.
 * DB may store 0–10 or 0–100.
 */
export function expatScoreOutOfTen(value: number | null | undefined): number | null {
  if (value == null) return null;
  const n = Number(value);
  if (Number.isNaN(n)) return null;
  if (n <= 10) return Math.min(10, Math.max(0, n));
  return Math.min(10, Math.max(0, n / 10));
}

export function formatScoreOutOfTen(value: number | null | undefined): string | null {
  const n = expatScoreOutOfTen(value);
  if (n == null) return null;
  const rounded = Math.round(n * 10) / 10;
  return `${rounded % 1 === 0 ? rounded.toFixed(0) : rounded.toFixed(1)}/10`;
}
