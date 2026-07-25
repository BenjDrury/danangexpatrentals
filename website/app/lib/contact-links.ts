import { WHATSAPP_NUMBER } from "backend";

const WHATSAPP_BASE = `https://wa.me/${WHATSAPP_NUMBER.replace(/\D/g, "")}`;

/** Primary renter contact */
export const WHATSAPP_URL = WHATSAPP_BASE;

/** Pre-filled WhatsApp for agents / owners reaching out to partner */
export const PARTNERS_WHATSAPP_URL = `${WHATSAPP_BASE}?text=${encodeURIComponent(
  "Hi — I’m a real estate agent / property owner in Da Nang and interested in working together."
)}`;

export const PARTNERS_HREF = "/partners";
