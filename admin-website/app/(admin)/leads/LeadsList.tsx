"use client";

import type { Lead } from "@/lib/data/leads";
import {
  buildLeadOutreach,
  type OutreachApartment,
  type OutreachArea,
} from "@/lib/lead-outreach";
import { ContactActions } from "../ContactActions";

function formatWhen(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function dash(value: string | null | undefined): string {
  const s = value?.trim();
  return s ? s : "—";
}

export function LeadsList({
  leads,
  apartments,
  areas,
}: {
  leads: Lead[];
  apartments: OutreachApartment[];
  areas: OutreachArea[];
}) {
  if (leads.length === 0) {
    return (
      <p className="mt-8 text-muted">
        No leads yet. Submissions from the public contact form will show up here.
      </p>
    );
  }

  const areasById = new Map(areas.map((a) => [a.id, a.name]));

  return (
    <div className="mt-8 space-y-6">
      {leads.map((lead) => {
        const outreach = buildLeadOutreach(lead, apartments, areas);
        const listing = lead.apartment_id
          ? apartments.find((a) => a.id === lead.apartment_id)
          : null;
        const areaLabel =
          lead.preferred_area?.trim() ||
          (lead.area_id ? areasById.get(lead.area_id) : null) ||
          null;

        return (
          <article
            key={lead.id}
            className="rounded-soft border border-line/80 bg-white px-5 py-5 sm:px-6"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-lg font-semibold text-charcoal">
                  {lead.email || lead.whatsapp || "Lead"}
                </h2>
                <time className="mt-0.5 block text-sm text-muted" dateTime={lead.created_at}>
                  {formatWhen(lead.created_at)}
                </time>
              </div>
              <ContactActions
                whatsapp={lead.whatsapp}
                email={lead.email}
                message={outreach.body}
                emailSubject={outreach.subject}
              />
            </div>

            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Email
                </dt>
                <dd className="mt-0.5 text-charcoal">{dash(lead.email)}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
                  WhatsApp
                </dt>
                <dd className="mt-0.5 text-charcoal">{dash(lead.whatsapp)}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Budget
                </dt>
                <dd className="mt-0.5 text-charcoal">{dash(lead.budget_range)}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Move date
                </dt>
                <dd className="mt-0.5 text-charcoal">{dash(lead.move_date)}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Stay
                </dt>
                <dd className="mt-0.5 text-charcoal">{dash(lead.length_of_stay)}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Area
                </dt>
                <dd className="mt-0.5 text-charcoal">{dash(areaLabel)}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Inquiry
                </dt>
                <dd className="mt-0.5 text-charcoal">
                  {listing
                    ? `Listing: ${listing.title}`
                    : lead.apartment_id
                      ? "Specific listing"
                      : "General search"}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Source
                </dt>
                <dd className="mt-0.5 text-muted">{dash(lead.source)}</dd>
              </div>
            </dl>
          </article>
        );
      })}
      <p className="text-xs text-muted">
        {leads.length} lead{leads.length === 1 ? "" : "s"}
      </p>
    </div>
  );
}
