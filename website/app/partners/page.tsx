import type { Metadata } from "next";
import { PartnersPageContent } from "./PartnersPageContent";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "For agents & owners",
  description:
    "Work with Da Nang Expat Rentals. We connect verified apartments with international renters looking for short and long stays.",
  path: "/partners",
});

export default function PartnersPage() {
  return <PartnersPageContent />;
}
