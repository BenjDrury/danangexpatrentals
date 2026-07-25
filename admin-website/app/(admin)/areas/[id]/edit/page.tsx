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
    <div className="animate-fade-up">
      <Link
        href="/areas"
        className="text-sm font-medium text-ocean transition hover:text-ocean-deep"
      >
        ← Areas
      </Link>
      <h1 className="mt-4 page-title">Edit area: {area.name}</h1>
      <p className="mt-1 text-muted">ID: {area.id}</p>

      <AreaEditForm area={area} />
    </div>
  );
}
