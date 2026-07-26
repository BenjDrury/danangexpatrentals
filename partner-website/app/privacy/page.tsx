import type { Metadata } from "next";
import { PrivacyContent } from "./PrivacyContent";

export const metadata: Metadata = {
  title: "Imprint & Privacy · Partner Studio",
  description:
    "Provider information and privacy policy for Da Nang Expat Rentals Partner Studio.",
};

export default function PrivacyPage() {
  return <PrivacyContent />;
}
