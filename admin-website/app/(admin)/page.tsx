import Link from "next/link";
import { getApartmentsCount, getLeadsCount } from "@/lib/data";

export default async function AdminDashboardPage() {
  const [leadsCount, apartmentsCount] = await Promise.all([
    getLeadsCount(),
    getApartmentsCount(),
  ]);

  return (
    <div className="animate-fade-up">
      <h1 className="page-title">Dashboard</h1>
      <p className="page-lead">
        Overview. Manage areas and apartment types from the subpages.
      </p>

      <dl className="mt-10 grid gap-8 sm:grid-cols-2">
        <div className="border-t border-line/80 pt-5">
          <dt className="text-sm font-medium text-muted">Leads</dt>
          <dd className="mt-1 font-display text-4xl font-semibold text-ocean">
            {leadsCount}
          </dd>
          <p className="mt-1 text-sm text-muted">Contact form submissions</p>
          <Link
            href="/leads"
            className="mt-3 inline-block text-sm font-medium text-ocean underline-offset-2 hover:underline"
          >
            View all leads
          </Link>
        </div>
        <div className="border-t border-line/80 pt-5">
          <dt className="text-sm font-medium text-muted">Apartments</dt>
          <dd className="mt-1 font-display text-4xl font-semibold text-ocean">
            {apartmentsCount}
          </dd>
          <p className="mt-1 text-sm text-muted">Listings in DB</p>
        </div>
      </dl>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link href="/leads" className="btn-primary">
          View leads
        </Link>
        <Link href="/apartments" className="btn-secondary">
          View apartments
        </Link>
        <Link href="/areas" className="btn-secondary">
          Manage areas
        </Link>
        <Link href="/apartment-types" className="btn-secondary">
          Manage apartment types
        </Link>
      </div>
    </div>
  );
}
