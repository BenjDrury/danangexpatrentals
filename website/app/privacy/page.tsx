import type { Metadata } from "next";
import { Section } from "../components/sections";

export const metadata: Metadata = {
  title: "Privacy Policy — Da Nang Expat Rentals",
  description: "Privacy policy for Da Nang Expat Rentals.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-foam">
      <Section bg="bg-white">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-4xl font-semibold tracking-tight text-charcoal sm:text-5xl">
            Privacy policy
          </h1>
          <p className="mt-6 text-lg text-muted">
            Placeholder. Add your privacy policy content here.
          </p>
        </div>
      </Section>
    </div>
  );
}
