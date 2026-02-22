import { getAnonClient } from "./client";

export async function getApartmentTypes() {
  const supabase = getAnonClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("apartment_types")
    .select("id, title, desc, sort_order")
    .order("sort_order");
  if (error) return [];
  return (data ?? []).map((row) => ({
    id: String(row.id),
    title: row.title,
    desc: row.desc,
    sort_order: row.sort_order,
  }));
}

export async function getApartmentTypeById(id: string) {
  const supabase = getAnonClient();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("apartment_types")
    .select("id, title, desc, sort_order")
    .eq("id", id)
    .single();
  if (error || !data) return null;
  return {
    id: String(data.id),
    title: data.title,
    desc: data.desc,
    sort_order: data.sort_order,
  };
}
