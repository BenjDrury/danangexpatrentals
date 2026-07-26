"use client";

import type { PartnerApplication } from "@/lib/data/partner-applications";

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

function roleLabel(role: string | null): string {
  if (!role) return "—";
  const labels: Record<string, string> = {
    agent: "Agent",
    owner: "Owner",
    property_manager: "Property manager",
    other: "Other",
  };
  return labels[role] ?? role;
}

function facebookHref(raw: string): string | null {
  const v = raw.trim();
  if (!v) return null;
  if (/^https?:\/\//i.test(v)) return v;
  if (/facebook\.com/i.test(v)) return `https://${v.replace(/^\/+/, "")}`;
  return `https://www.facebook.com/${v.replace(/^@/, "")}`;
}

export function PartnerApplicationsList({
  applications,
}: {
  applications: PartnerApplication[];
}) {
  if (applications.length === 0) {
    return (
      <p className="mt-8 text-muted">
        No partner applications yet. Submissions from{" "}
        <span className="font-medium text-charcoal">/partners/apply</span> will show up here.
      </p>
    );
  }

  return (
    <div className="mt-8 space-y-6">
      {applications.map((app) => {
        const wa = whatsappHref(app.whatsapp);
        const fb = app.facebook_page ? facebookHref(app.facebook_page) : null;
        return (
          <article
            key={app.id}
            className="rounded-soft border border-line/80 bg-white px-5 py-5 sm:px-6"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-display text-lg font-semibold text-charcoal">{app.name}</h2>
              <time className="text-sm text-muted" dateTime={app.created_at}>
                {formatWhen(app.created_at)}
              </time>
            </div>

            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
                  WhatsApp
                </dt>
                <dd className="mt-0.5 font-medium text-charcoal">
                  {wa ? (
                    <a
                      href={wa}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-ocean underline-offset-2 hover:underline"
                    >
                      {app.whatsapp}
                    </a>
                  ) : (
                    dash(app.whatsapp)
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Email</dt>
                <dd className="mt-0.5">
                  <a
                    href={`mailto:${app.email}`}
                    className="text-ocean underline-offset-2 hover:underline"
                  >
                    {app.email}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Company
                </dt>
                <dd className="mt-0.5 text-charcoal">{dash(app.company_name)}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Role</dt>
                <dd className="mt-0.5 text-charcoal">{roleLabel(app.role)}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Facebook page
                </dt>
                <dd className="mt-0.5 text-charcoal">
                  {fb ? (
                    <a
                      href={fb}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="break-all text-ocean underline-offset-2 hover:underline"
                    >
                      {app.facebook_page}
                    </a>
                  ) : (
                    "—"
                  )}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Areas
                </dt>
                <dd className="mt-0.5 text-charcoal">{dash(app.areas)}</dd>
              </div>
              {app.inventory_note?.trim() ? (
                <div className="sm:col-span-2">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
                    Inventory note
                  </dt>
                  <dd className="mt-0.5 whitespace-pre-wrap text-charcoal">
                    {app.inventory_note}
                  </dd>
                </div>
              ) : null}
            </dl>
          </article>
        );
      })}
      <p className="text-xs text-muted">
        {applications.length} application{applications.length === 1 ? "" : "s"}
      </p>
    </div>
  );
}
