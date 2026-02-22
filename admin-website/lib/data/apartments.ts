import { getAnonClient } from "./client";

export async function getApartmentsCount() {
  const supabase = getAnonClient();
  if (!supabase) return 0;
  const { count, error } = await supabase
    .from("apartments")
    .select("id", { count: "exact", head: true });
  if (error) return 0;
  return count ?? 0;
}
