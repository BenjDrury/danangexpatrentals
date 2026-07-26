/** Public marketing site origin for apartment / area links in outreach. */
export function getPublicSiteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    process.env.NEXT_PUBLIC_WEBSITE_URL?.replace(/\/$/, "") ||
    "https://danangexpatrentals.com"
  );
}

export function apartmentPublicUrl(id: string, publicSlug?: string | null): string {
  const base = getPublicSiteUrl();
  if (publicSlug) return `${base}/apartments/${publicSlug}`;
  return `${base}/apartments/${id}`;
}

/** Digits-only WhatsApp number, or null if too short. */
export function whatsappDigits(whatsapp: string): string | null {
  const digits = whatsapp.replace(/\D/g, "");
  return digits.length >= 8 ? digits : null;
}

export function whatsappHref(whatsapp: string, text?: string): string | null {
  const digits = whatsappDigits(whatsapp);
  if (!digits) return null;
  const base = `https://wa.me/${digits}`;
  if (!text?.trim()) return base;
  return `${base}?text=${encodeURIComponent(text)}`;
}

export function mailtoHref(email: string, subject?: string, body?: string): string {
  const params = new URLSearchParams();
  if (subject?.trim()) params.set("subject", subject);
  if (body?.trim()) params.set("body", body);
  const qs = params.toString();
  return qs ? `mailto:${email}?${qs}` : `mailto:${email}`;
}
