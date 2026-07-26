import { createClient } from "@/lib/supabase/server";
import type { LanguageFeedbackRow } from "@/lib/language-feedback";

export async function listRecentLanguageFeedback(
  limit = 40,
): Promise<LanguageFeedbackRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("language_feedback")
    .select("id, selected_text, page_path, locale, comment, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];

  return data.map((row) => ({
    id: row.id as string,
    selectedText: (row.selected_text as string) ?? "",
    pagePath: (row.page_path as string) ?? "",
    locale: (row.locale as string) ?? "",
    comment: (row.comment as string) ?? "",
    createdAt: (row.created_at as string) ?? "",
  }));
}
