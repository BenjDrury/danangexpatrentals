"use client";

import type { Lead } from "@/lib/data/leads";

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

function whatsappHref(whatsapp: string): string | null {
  const digits = whatsapp.replace(/\D/g, "");
  if (digits.length < 8) return null;
  return `https://wa.me/${digits}`;
}

export function LeadsList({ leads }: { leads: Lead[] }) {
  if (leads.length === 0) {
    return (
      <p className="mt-8 text-muted">
        No leads yet. Submissions from the public contact form will show up here.
      </p>
    );
  }

  return (
    <div className="mt-8 overflow-x-auto">
      <table className="w-full min-w-[52rem] border-y border-line/80 text-left text-sm">
        <thead>
          <tr className="border-b border-line/80 text-xs font-semibold uppercase tracking-wide text-muted">
            <th className="py-3 pr-4 font-semibold">Submitted</th>
            <th className="py-3 pr-4 font-semibold">WhatsApp</th>
            <th className="py-3 pr-4 font-semibold">Email</th>
            <th className="py-3 pr-4 font-semibold">Budget</th>
            <th className="py-3 pr-4 font-semibold">Move date</th>
            <th className="py-3 pr-4 font-semibold">Stay</th>
            <th className="py-3 pr-4 font-semibold">Area</th>
            <th className="py-3 font-semibold">Source</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line/60">
          {leads.map((lead) => {
            const wa = whatsappHref(lead.whatsapp);
            return (
              <tr key={lead.id} className="align-top">
                <td className="py-3.5 pr-4 whitespace-nowrap text-muted">
                  {formatWhen(lead.created_at)}
                </td>
                <td className="py-3.5 pr-4 font-medium text-charcoal">
                  {wa ? (
                    <a
                      href={wa}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-ocean underline-offset-2 hover:underline"
                    >
                      {lead.whatsapp}
                    </a>
                  ) : (
                    dash(lead.whatsapp)
                  )}
                </td>
                <td className="py-3.5 pr-4 text-charcoal">
                  {lead.email ? (
                    <a
                      href={`mailto:${lead.email}`}
                      className="text-ocean underline-offset-2 hover:underline"
                    >
                      {lead.email}
                    </a>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="py-3.5 pr-4 text-charcoal">{dash(lead.budget_range)}</td>
                <td className="py-3.5 pr-4 text-charcoal">{dash(lead.move_date)}</td>
                <td className="py-3.5 pr-4 text-charcoal">{dash(lead.length_of_stay)}</td>
                <td className="py-3.5 pr-4 text-charcoal">{dash(lead.preferred_area)}</td>
                <td className="py-3.5 text-muted">{dash(lead.source)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="mt-3 text-xs text-muted">
        {leads.length} lead{leads.length === 1 ? "" : "s"}
      </p>
    </div>
  );
}
