import type { Metadata } from "next";
import Link from "next/link";
import { LegalDoc, LegalSection } from "../components/LegalDoc";
import { WHATSAPP_URL } from "../lib/contact-links";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Imprint & Privacy",
  description:
    "Provider information (imprint) and privacy policy for Da Nang Expat Rentals.",
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <LegalDoc title="Imprint & Privacy" updated="26 July 2026">
      <LegalSection title="A. Imprint / provider information">
        <p>
          Information about the service provider of this website and related
          matching service:
        </p>
        <dl className="space-y-3 rounded-soft border border-line bg-foam/60 px-5 py-5 sm:px-6">
          <div>
            <dt className="text-sm font-medium text-muted">Service name</dt>
            <dd className="mt-0.5 text-charcoal">Da Nang Expat Rentals</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-muted">Responsible person</dt>
            <dd className="mt-0.5 text-charcoal">Benjamin</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-muted">Place of business</dt>
            <dd className="mt-0.5 text-charcoal">Da Nang, Vietnam</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-muted">Email</dt>
            <dd className="mt-0.5">
              <a
                href="mailto:benjamin@danangexpatrentals.com"
                className="font-medium text-ocean transition hover:text-ocean-deep"
              >
                benjamin@danangexpatrentals.com
              </a>
            </dd>
          </div>
          {WHATSAPP_URL && (
            <div>
              <dt className="text-sm font-medium text-muted">WhatsApp</dt>
              <dd className="mt-0.5 text-charcoal">
                Via the number linked on our{" "}
                <Link
                  href="/contact"
                  className="font-medium text-ocean transition hover:text-ocean-deep"
                >
                  contact page
                </Link>
              </dd>
            </div>
          )}
        </dl>
        <p>
          Website content is provided in good faith for informational and matching
          purposes. Editorial tips and area guides reflect our experience and may
          change over time.
        </p>
      </LegalSection>

      <LegalSection title="B. Privacy policy — overview">
        <p>
          This section explains how we collect, use, and share personal data when
          you use danangexpatrentals.com and related channels (including WhatsApp
          and email). By using the Service or contacting us, you acknowledge this
          notice.
        </p>
      </LegalSection>

      <LegalSection title="1. What we collect">
        <p>Depending on how you reach us, we may process:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <span className="font-medium text-charcoal">Match / concierge form:</span>{" "}
            Email (required), WhatsApp number (optional), budget range, move date,
            length of stay, preferred area, and related notes; plus any apartment
            or area IDs you came from.
          </li>
          <li>
            <span className="font-medium text-charcoal">Messages:</span> Content you
            send via WhatsApp, email, or other channels you choose.
          </li>
          <li>
            <span className="font-medium text-charcoal">Technical data:</span>{" "}
            Standard server or hosting logs (e.g. IP address, browser type, pages
            visited) that our hosting provider may process to operate and secure
            the site.
          </li>
        </ul>
        <p>We do not intentionally collect payment card data on this website.</p>
      </LegalSection>

      <LegalSection title="2. Why we use your data">
        <ul className="list-disc space-y-2 pl-5">
          <li>To respond to your enquiry and send apartment options.</li>
          <li>
            To coordinate with trusted agents, owners, or partners who may help
            with viewings or leases.
          </li>
          <li>To improve our matching process and website experience.</li>
          <li>To prevent abuse and protect the security of the Service.</li>
          <li>To comply with legal obligations where applicable.</li>
        </ul>
      </LegalSection>

      <LegalSection title="3. Legal bases (where GDPR / similar rules apply)">
        <p>
          Where European or comparable data-protection law applies, we typically
          rely on: (a) steps prior to a contract / responding to your request; (b)
          our legitimate interests in operating a matching service and preventing
          misuse; and/or (c) your consent where you voluntarily provide optional
          details or continue a conversation on messaging apps.
        </p>
      </LegalSection>

      <LegalSection title="4. Sharing">
        <p>We may share relevant enquiry details with:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            Property partners (agents, owners, managers) when needed to check
            availability or arrange introductions.
          </li>
          <li>
            Service providers who help us run the Service (e.g. hosting, database,
            email delivery), under appropriate confidentiality and security
            expectations.
          </li>
          <li>Authorities if required by law.</li>
        </ul>
        <p>We do not sell your personal data.</p>
      </LegalSection>

      <LegalSection title="5. International transfers">
        <p>
          We operate from Vietnam and may use infrastructure or tools located in
          other countries. If your data is transferred internationally, we take
          reasonable steps consistent with the tools we use and applicable law.
        </p>
      </LegalSection>

      <LegalSection title="6. Retention">
        <p>
          Lead and message data are kept for as long as needed to handle your
          request, maintain useful partner coordination history, and meet legal or
          operational needs. You can ask us to delete or update your data (see
          below).
        </p>
      </LegalSection>

      <LegalSection title="7. Cookies and analytics">
        <p>
          We use a first-party anonymous visitor cookie to count listing page
          views and unique visitors on our website. This helps partners see how
          their listings perform. The cookie does not identify you by name and is
          not used for advertising. We do not use third-party marketing analytics
          cookies. If that changes, we will update this notice and, where
          required, seek consent.
        </p>
      </LegalSection>

      <LegalSection title="8. Your rights">
        <p>
          Depending on your location, you may have rights to access, correct,
          delete, or restrict processing of your personal data, and to object to
          certain processing. To exercise these rights, email{" "}
          <a
            href="mailto:benjamin@danangexpatrentals.com"
            className="font-medium text-ocean transition hover:text-ocean-deep"
          >
            benjamin@danangexpatrentals.com
          </a>
          . We may need to verify your identity before acting on a request.
        </p>
      </LegalSection>

      <LegalSection title="9. Children">
        <p>
          The Service is aimed at adults arranging housing. We do not knowingly
          collect data from children.
        </p>
      </LegalSection>

      <LegalSection title="10. Changes">
        <p>
          We may update this Imprint & Privacy notice. The “Last updated” date
          will change when we do. Material changes will be reflected on this page.
        </p>
      </LegalSection>

      <LegalSection title="11. Related terms">
        <p>
          Use of the Service is also governed by our{" "}
          <Link
            href="/terms"
            className="font-medium text-ocean transition hover:text-ocean-deep"
          >
            Terms & Conditions
          </Link>
          .
        </p>
      </LegalSection>
    </LegalDoc>
  );
}
