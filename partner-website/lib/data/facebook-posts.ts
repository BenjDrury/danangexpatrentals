import { createClient } from "@/lib/supabase/server";

export type ListingFacebookPost = {
  id: string;
  apartmentId: string;
  batchId: string;
  destination: "page" | "group";
  facebookGroupId: string | null;
  groupName: string | null;
  groupUrl: string | null;
  facebookPostId: string | null;
  permalink: string | null;
  photoCount: number;
  captionPreview: string | null;
  postedAt: string;
  clearedAt: string | null;
};

export type ListingFacebookBatchSummary = {
  batchId: string;
  postedAt: string;
  photoCount: number;
  destinations: {
    destination: "page" | "group";
    label: string;
    permalink: string | null;
    groupUrl: string | null;
  }[];
};

async function touchListingFacebookPostedAt(
  apartmentId: string,
  estateCompanyId: string,
  postedAt: string,
) {
  const supabase = await createClient();
  await supabase
    .from("apartments")
    .update({
      last_facebook_posted_at: postedAt,
      last_bumped_at: postedAt,
      updated_at: postedAt,
    })
    .eq("id", apartmentId)
    .eq("estate_company_id", estateCompanyId);
}

function captionPreview(caption: string | null | undefined): string | null {
  const t = caption?.trim();
  if (!t) return null;
  return t.length > 180 ? `${t.slice(0, 179)}…` : t;
}

export async function recordListingFacebookPagePost(params: {
  apartmentId: string;
  estateCompanyId: string;
  batchId: string;
  facebookPostId: string;
  permalink?: string | null;
  photoCount: number;
  caption?: string | null;
  postedBy?: string | null;
}): Promise<{ error?: string; ok?: boolean }> {
  const supabase = await createClient();
  const postedAt = new Date().toISOString();
  const { error } = await supabase.from("listing_facebook_posts").insert({
    apartment_id: params.apartmentId,
    estate_company_id: params.estateCompanyId,
    batch_id: params.batchId,
    destination: "page",
    facebook_post_id: params.facebookPostId,
    permalink: params.permalink ?? null,
    photo_count: params.photoCount,
    caption_preview: captionPreview(params.caption),
    posted_at: postedAt,
    posted_by: params.postedBy ?? null,
  });

  if (error) {
    if (error.message.toLowerCase().includes("listing_facebook_posts")) {
      return {
        error: "Facebook post history table missing — run supabase/26-listing-facebook-posts.sql.",
      };
    }
    return { error: error.message };
  }

  await touchListingFacebookPostedAt(
    params.apartmentId,
    params.estateCompanyId,
    postedAt,
  );
  return { ok: true };
}

export async function recordListingFacebookGroupPost(params: {
  apartmentId: string;
  estateCompanyId: string;
  batchId: string;
  facebookGroupId: string | null;
  groupName: string;
  groupUrl: string;
  photoCount: number;
  caption?: string | null;
  postedBy?: string | null;
}): Promise<{ error?: string; ok?: boolean }> {
  const supabase = await createClient();
  const postedAt = new Date().toISOString();
  const { error } = await supabase.from("listing_facebook_posts").insert({
    apartment_id: params.apartmentId,
    estate_company_id: params.estateCompanyId,
    batch_id: params.batchId,
    destination: "group",
    facebook_group_id: params.facebookGroupId,
    group_name: params.groupName,
    group_url: params.groupUrl,
    photo_count: params.photoCount,
    caption_preview: captionPreview(params.caption),
    posted_at: postedAt,
    posted_by: params.postedBy ?? null,
  });

  if (error) {
    if (error.message.toLowerCase().includes("listing_facebook_posts")) {
      return {
        error: "Facebook post history table missing — run supabase/26-listing-facebook-posts.sql.",
      };
    }
    return { error: error.message };
  }

  await touchListingFacebookPostedAt(
    params.apartmentId,
    params.estateCompanyId,
    postedAt,
  );
  return { ok: true };
}

export async function listListingFacebookBatches(
  estateCompanyId: string,
  apartmentId: string,
  opts?: { includeCleared?: boolean; limit?: number },
): Promise<ListingFacebookBatchSummary[]> {
  const supabase = await createClient();
  let q = supabase
    .from("listing_facebook_posts")
    .select(
      "id, batch_id, destination, group_name, group_url, permalink, photo_count, posted_at, cleared_at",
    )
    .eq("estate_company_id", estateCompanyId)
    .eq("apartment_id", apartmentId)
    .order("posted_at", { ascending: false });

  if (!opts?.includeCleared) {
    q = q.is("cleared_at", null);
  }

  const { data, error } = await q.limit(200);
  if (error || !data) return [];

  const byBatch = new Map<string, ListingFacebookBatchSummary>();
  for (const row of data) {
    const batchId = row.batch_id as string;
    const postedAt = row.posted_at as string;
    const existing = byBatch.get(batchId);
    const label =
      row.destination === "page"
        ? "Facebook Page"
        : ((row.group_name as string | null)?.trim() || "Facebook group");

    const dest = {
      destination: row.destination as "page" | "group",
      label,
      permalink: (row.permalink as string | null) ?? null,
      groupUrl: (row.group_url as string | null) ?? null,
    };

    if (!existing) {
      byBatch.set(batchId, {
        batchId,
        postedAt,
        photoCount: (row.photo_count as number) ?? 0,
        destinations: [dest],
      });
    } else {
      existing.destinations.push(dest);
      if (postedAt > existing.postedAt) existing.postedAt = postedAt;
      existing.photoCount = Math.max(
        existing.photoCount,
        (row.photo_count as number) ?? 0,
      );
    }
  }

  const batches = [...byBatch.values()].sort((a, b) =>
    b.postedAt.localeCompare(a.postedAt),
  );
  return batches.slice(0, opts?.limit ?? 20);
}

/** Latest active publish summary per listing (for home feed). */
export async function getLatestFacebookPublishByListingIds(
  estateCompanyId: string,
  apartmentIds: string[],
): Promise<Map<string, ListingFacebookBatchSummary>> {
  const map = new Map<string, ListingFacebookBatchSummary>();
  if (apartmentIds.length === 0) return map;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("listing_facebook_posts")
    .select(
      "apartment_id, batch_id, destination, group_name, group_url, permalink, photo_count, posted_at",
    )
    .eq("estate_company_id", estateCompanyId)
    .in("apartment_id", apartmentIds)
    .is("cleared_at", null)
    .order("posted_at", { ascending: false })
    .limit(Math.min(apartmentIds.length * 20, 500));

  if (error || !data) return map;

  const seenBatch = new Set<string>();
  for (const row of data) {
    const apartmentId = row.apartment_id as string;
    const batchId = row.batch_id as string;
    const key = `${apartmentId}:${batchId}`;
    if (map.has(apartmentId) && !seenBatch.has(key)) {
      // Already have a newer batch for this listing
      if (map.get(apartmentId)!.batchId !== batchId) continue;
    }
    seenBatch.add(key);

    const label =
      row.destination === "page"
        ? "Facebook Page"
        : ((row.group_name as string | null)?.trim() || "Facebook group");
    const dest = {
      destination: row.destination as "page" | "group",
      label,
      permalink: (row.permalink as string | null) ?? null,
      groupUrl: (row.group_url as string | null) ?? null,
    };

    const existing = map.get(apartmentId);
    if (!existing) {
      map.set(apartmentId, {
        batchId,
        postedAt: row.posted_at as string,
        photoCount: (row.photo_count as number) ?? 0,
        destinations: [dest],
      });
    } else if (existing.batchId === batchId) {
      existing.destinations.push(dest);
    }
  }

  return map;
}

export async function clearListingFacebookPosts(
  estateCompanyId: string,
  apartmentId: string,
  opts?: { olderThanDays?: number },
): Promise<{ error?: string; ok?: boolean; cleared?: number }> {
  const supabase = await createClient();
  const now = new Date().toISOString();
  let q = supabase
    .from("listing_facebook_posts")
    .update({ cleared_at: now })
    .eq("estate_company_id", estateCompanyId)
    .eq("apartment_id", apartmentId)
    .is("cleared_at", null);

  if (opts?.olderThanDays != null && opts.olderThanDays > 0) {
    const cutoff = new Date();
    cutoff.setUTCDate(cutoff.getUTCDate() - opts.olderThanDays);
    q = q.lt("posted_at", cutoff.toISOString());
  }

  const { data, error } = await q.select("id");
  if (error) return { error: error.message };

  // Refresh denormalized timestamp from remaining active posts
  const { data: latest } = await supabase
    .from("listing_facebook_posts")
    .select("posted_at")
    .eq("estate_company_id", estateCompanyId)
    .eq("apartment_id", apartmentId)
    .is("cleared_at", null)
    .order("posted_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  await supabase
    .from("apartments")
    .update({
      last_facebook_posted_at: (latest?.posted_at as string | null) ?? null,
      updated_at: now,
    })
    .eq("id", apartmentId)
    .eq("estate_company_id", estateCompanyId);

  return { ok: true, cleared: data?.length ?? 0 };
}
