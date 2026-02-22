import Link from "next/link";
import { notFound } from "next/navigation";
import { getAreaById } from "@/lib/data";
import { AreaEditForm } from "../AreaEditForm";

type Props = { params: Promise<{ id: string }> };

export default async function EditAreaPage({ params }: Props) {
  const { id } = await params;
  const area = await getAreaById(id);
  if (!area) notFound();

  return (
    <div>
      <Link href="/areas" className="text-sm font-medium text-teal-600 hover:text-teal-700">
        ← Areas
      </Link>
      <h1 className="mt-4 text-2xl font-bold text-slate-900">Edit area: {area.name}</h1>
      <p className="mt-1 text-slate-500">ID: {area.id}</p>

      <AreaEditForm area={area} />
    </div>
  );
}
