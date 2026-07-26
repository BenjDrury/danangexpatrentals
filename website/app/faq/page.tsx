import type { Metadata } from "next";
import { SectionHero } from "../components/sections";
import { WHATSAPP_URL } from "../lib/contact-links";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "FAQ",
  description: "Frequently asked questions about finding apartments in Da Nang.",
  path: "/faq",
});

export default function FaqPage() {
  return (
    <div className="min-h-screen bg-foam">
      <SectionHero
        variant="page"
        title="FAQ"
        subtitle={
          WHATSAPP_URL
            ? "Coming soon. In the meantime, get in touch via the contact page or WhatsApp."
            : "Coming soon. In the meantime, get in touch via the contact page."
        }
      />
    </div>
  );
}
