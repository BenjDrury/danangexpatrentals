import type { Metadata } from "next";
import { TermsContent } from "./TermsContent";

export const metadata: Metadata = {
  title: "Terms & Conditions · Partner Studio",
  description:
    "Terms and conditions for Da Nang Expat Rentals Partner Studio.",
};

export default function TermsPage() {
  return <TermsContent />;
}
