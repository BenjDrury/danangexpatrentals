import { getAnonClient } from "./client";

export async function getAreas() {
  const supabase = getAnonClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("areas")
    .select("id, name, image, vibe, price_range, who")
    .order("id");
  if (error) return [];
  return data ?? [];
}

export async function getAreaById(id: string) {
  const supabase = getAnonClient();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("areas")
    .select("id, name, image, vibe, price_range, who")
    .eq("id", id)
    .single();
  if (error || !data) return null;
  return data;
}
