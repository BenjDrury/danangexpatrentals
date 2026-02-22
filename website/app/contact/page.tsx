import type { Metadata } from "next";
import { WHATSAPP_NUMBER } from "backend";
import Link from "next/link";
import { ConciergeForm } from "../components/ConciergeForm";
import { Section, SectionHero } from "../components/sections";

const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER.replace(/\D/g, "")}`;

export const metadata: Metadata = {
  title: "Contact — Get Apartment Matches in Da Nang",
  description:
    "Tell us your budget and move date. We'll send you verified apartment options in Da Nang within 24 hours. Form, WhatsApp, or email.",
};

type Props = { searchParams: Promise<{ [key: string]: string | string[] | undefined }> };

export default async function ContactPage({ searchParams }: Props) {
  const params = await searchParams;
  const preferredArea = typeof params.preferred_area === "string" ? params.preferred_area : "";
  const areaId = typeof params.areaId === "string" ? params.areaId : undefined;
  const apartmentId = typeof params.apartmentId === "string" ? params.apartmentId : undefined;

  return (
    <div className="min-h-screen bg-slate-50">
      <SectionHero
        variant="page"
        title="Tell us what you need — we'll help."
        subtitle="Use the form below, WhatsApp for the fastest reply, or email. We reply within 24 hours."
      />

      <Section bg="bg-slate-50">
        <div className="grid gap-8 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Form (main)</h2>
            <p className="mt-2 text-slate-600">
              Best if you want to share budget, move date, and area in one go. We'll follow up on WhatsApp or email.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">WhatsApp (fastest)</h2>
            <p className="mt-2 text-slate-600">
              Message us directly for a quick reply. Great if you're already in Da Nang or have a tight timeline.
            </p>
            <Link
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#25D366] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#20BD5A]"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Chat on WhatsApp
            </Link>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Email</h2>
            <p className="mt-2 text-slate-600">
              Prefer email? We'll reply to the address you give in the form. Same 24h response time.
            </p>
          </div>
        </div>
      </Section>

      <Section bg="bg-white">
        <div className="mx-auto max-w-xl">
          <h2 className="text-center text-2xl font-bold text-slate-900">
            Tell us what you're looking for — we'll send options
          </h2>
          <p className="mt-4 text-center text-slate-600">
            Free. No spam. No obligation. We reply within 24h.
          </p>
          <div className="mt-10 rounded-2xl border border-slate-200 bg-slate-50/50 p-8 shadow-lg sm:p-10">
            <ConciergeForm
              initialPreferredArea={preferredArea}
              initialAreaId={areaId}
              initialApartmentId={apartmentId}
            />
          </div>
        </div>
      </Section>

      <Section bg="bg-slate-50">
        <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">What happens after you contact us</h2>
        <ul className="mt-8 space-y-4 text-slate-700">
          <li><strong>Reply time:</strong> We aim to reply within a few hours, and always within 24 hours.</li>
          <li><strong>What info helps:</strong> Budget, move date, length of stay, and preferred area (if any).</li>
          <li><strong>What you'll get:</strong> A shortlist of available apartments that match, plus an intro to the agent. No obligation to take any of them.</li>
        </ul>
        <p className="mt-8 rounded-xl border border-slate-200 bg-white p-6 text-slate-700">
          <strong>Location reassurance:</strong> We work with agents across An Thuong, My An, My Khe, and other expat-friendly areas. Even if you're booking remotely, we verify availability and help you secure a place before or after you arrive.
        </p>
      </Section>
    </div>
  );
}
