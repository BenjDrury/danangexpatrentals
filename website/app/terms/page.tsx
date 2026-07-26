import type { Metadata } from "next";
import Link from "next/link";
import { LegalDoc, LegalSection } from "../components/LegalDoc";

export const metadata: Metadata = {
  title: "Terms & Conditions — Da Nang Expat Rentals",
  description:
    "Terms and conditions for using Da Nang Expat Rentals’ website and matching service.",
};

export default function TermsPage() {
  return (
    <LegalDoc title="Terms & Conditions" updated="26 July 2026">
      <LegalSection title="1. Who we are">
        <p>
          These Terms & Conditions (“Terms”) govern your use of the Da Nang Expat
          Rentals website and related matching service (the “Service”), operated
          by Da Nang Expat Rentals (“we”, “us”, “our”). Contact:{" "}
          <a
            href="mailto:benjamin@danangexpatrentals.com"
            className="font-medium text-ocean transition hover:text-ocean-deep"
          >
            benjamin@danangexpatrentals.com
          </a>
          . More provider details are in our{" "}
          <Link
            href="/privacy"
            className="font-medium text-ocean transition hover:text-ocean-deep"
          >
            Imprint & Privacy
          </Link>{" "}
          page.
        </p>
      </LegalSection>

      <LegalSection title="2. Acceptance">
        <p>
          By browsing this website, submitting a match request, or messaging us
          about rentals, you agree to these Terms. If you do not agree, please do
          not use the Service.
        </p>
      </LegalSection>

      <LegalSection title="3. What the Service is">
        <p>
          We help expats and remote workers find apartments in Da Nang by
          collecting preferences, checking availability with partners we work
          with, and introducing you to suitable options. We are a housing
          concierge / matching service — not a landlord, property owner, or
          guaranteed booking platform.
        </p>
        <p>
          Lease agreements, deposits, move-in conditions, and payments are
          between you and the landlord, agent, or property manager. We do not
          become a party to those contracts unless we expressly say so in writing.
        </p>
      </LegalSection>

      <LegalSection title="4. No guarantee of availability or outcome">
        <p>
          Listings, guides, and recommendations are provided for information and
          matching purposes. Availability, pricing, photos, and amenities can
          change quickly. We verify where we reasonably can, but we do not
          guarantee that any option will remain available, that a viewing will
          happen on a given date, or that you will secure a lease.
        </p>
      </LegalSection>

      <LegalSection title="5. Your responsibilities">
        <p>You agree to:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Provide accurate contact and preference details.</li>
          <li>
            Use the Service only for personal rental enquiries (or legitimate
            partner enquiries via our partner channels).
          </li>
          <li>
            Independently review any lease, deposit terms, and property condition
            before you commit money or sign.
          </li>
          <li>
            Not misuse the Service (spam, scraping, fraud, or harassment of our
            team or partners).
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="6. Fees">
        <p>
          Using the public website and requesting a match is free for renters
          unless we clearly state otherwise before you proceed. Any fees charged
          by landlords, agents, or third parties (deposits, agency fees, utilities,
          etc.) are separate and not controlled by us.
        </p>
      </LegalSection>

      <LegalSection title="7. Third-party services">
        <p>
          We may communicate via WhatsApp, email, or other tools, and may
          introduce you to independent agents or owners. Those parties have their
          own practices and terms. Links to external sites or apps are provided
          for convenience; we are not responsible for their content or policies.
        </p>
      </LegalSection>

      <LegalSection title="8. Intellectual property">
        <p>
          Website content, branding, guides, and materials we publish remain ours
          (or our licensors’). You may not copy, scrape, or republish them for
          commercial use without our prior written consent.
        </p>
      </LegalSection>

      <LegalSection title="9. Limitation of liability">
        <p>
          To the fullest extent permitted by applicable law, we are not liable for
          indirect, incidental, or consequential losses arising from use of the
          Service, including disputes with landlords or agents, lost deposits,
          travel costs, or decisions made based on information we share.
        </p>
        <p>
          Nothing in these Terms excludes liability that cannot be limited under
          applicable law (for example, for fraud or personal injury caused by
          negligence where such exclusion is unlawful).
        </p>
      </LegalSection>

      <LegalSection title="10. Changes">
        <p>
          We may update these Terms from time to time. The “Last updated” date at
          the top will change when we do. Continued use of the Service after an
          update means you accept the revised Terms.
        </p>
      </LegalSection>

      <LegalSection title="11. Governing law">
        <p>
          These Terms are governed by the laws of Vietnam, without regard to
          conflict-of-law rules. Courts in Da Nang, Vietnam, shall have
          non-exclusive jurisdiction, unless mandatory consumer protection rules
          in your country of residence require otherwise.
        </p>
      </LegalSection>

      <LegalSection title="12. Contact">
        <p>
          Questions about these Terms:{" "}
          <a
            href="mailto:benjamin@danangexpatrentals.com"
            className="font-medium text-ocean transition hover:text-ocean-deep"
          >
            benjamin@danangexpatrentals.com
          </a>{" "}
          or via WhatsApp from our{" "}
          <Link
            href="/contact"
            className="font-medium text-ocean transition hover:text-ocean-deep"
          >
            contact page
          </Link>
          .
        </p>
      </LegalSection>
    </LegalDoc>
  );
}
