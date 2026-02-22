import Link from "next/link";
import { getAreas } from "@/lib/data";

export default async function AdminAreasPage() {
  const areas = await getAreas();

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Areas</h1>
      <p className="mt-2 text-slate-600">
        Edit areas shown on the main site. Changes appear on the public areas page.
      </p>

      {areas.length === 0 ? (
        <p className="mt-6 text-slate-500">No areas yet. Run the Supabase seed or add in Supabase Table Editor.</p>
      ) : (
        <ul className="mt-6 space-y-2">
          {areas.map((a) => (
            <li key={a.id} className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 bg-white px-4 py-3">
              <span className="font-medium text-slate-900">{a.name}</span>
              <span className="text-sm text-slate-500">{a.id}</span>
              <Link
                href={`/areas/${a.id}/edit`}
                className="rounded-lg bg-teal-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-700"
              >
                Edit
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
