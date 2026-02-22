import Link from "next/link";
import { getApartmentsCount, getLeadsCount } from "@/lib/data";

export default async function AdminDashboardPage() {
  const [leadsCount, apartmentsCount] = await Promise.all([
    getLeadsCount(),
    getApartmentsCount(),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
      <p className="mt-2 text-slate-600">
        Overview. Manage areas and apartment types from the subpages.
      </p>

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Leads</h2>
          <p className="mt-1 text-3xl font-bold text-teal-600">{leadsCount}</p>
          <p className="mt-1 text-sm text-slate-500">Contact form submissions</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Apartments</h2>
          <p className="mt-1 text-3xl font-bold text-teal-600">{apartmentsCount}</p>
          <p className="mt-1 text-sm text-slate-500">Listings in DB</p>
        </div>
      </div>

      <div className="mt-10 flex flex-wrap gap-4">
        <Link
          href="/areas"
          className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700"
        >
          Manage areas
        </Link>
        <Link
          href="/apartment-types"
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Manage apartment types
        </Link>
      </div>
    </div>
  );
}
