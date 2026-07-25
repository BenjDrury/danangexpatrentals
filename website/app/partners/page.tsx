import type { Metadata } from "next";
import { PartnersPageContent } from "./PartnersPageContent";

export const metadata: Metadata = {
  title: "For agents & owners — Da Nang Expat Rentals",
  description:
    "Work with Da Nang Expat Rentals. We connect verified apartments with international renters looking for short and long stays.",
};

export default function PartnersPage() {
  return <PartnersPageContent />;
}
