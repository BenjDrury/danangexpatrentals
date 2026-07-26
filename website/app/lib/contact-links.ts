import { WHATSAPP_NUMBER } from "backend";

/** Digits-only team number, or null when WhatsApp contact is disabled. */
export const WHATSAPP_DIGITS = (() => {
  const digits = WHATSAPP_NUMBER.replace(/\D/g, "");
  return digits.length > 0 ? digits : null;
})();

const WHATSAPP_BASE = WHATSAPP_DIGITS
  ? `https://wa.me/${WHATSAPP_DIGITS}`
  : null;

/** Primary renter contact — null when WHATSAPP_NUMBER is unset. */
export const WHATSAPP_URL = WHATSAPP_BASE;

/** Pre-filled WhatsApp for agents / owners — null when WHATSAPP_NUMBER is unset. */
export const PARTNERS_WHATSAPP_URL = WHATSAPP_BASE
  ? `${WHATSAPP_BASE}?text=${encodeURIComponent(
      "Hi — I’m a real estate agent / property owner in Da Nang and interested in working together."
    )}`
  : null;

export const PARTNERS_HREF = "/partners";

/** Public partner application form. */
export const PARTNERS_APPLY_HREF = "/partners/apply";
