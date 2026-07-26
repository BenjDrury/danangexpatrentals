"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  convertPrice,
  sanitizeListingDescription,
  type Apartment,
  type PriceCurrency,
  type PropertyType,
  type UtilitiesIncluded,
} from "types";
import { requireAdmin, requirePartner } from "@/lib/auth";
import { getUsdVndRate } from "@/lib/fx";
import { createClient, getServiceRoleClient } from "@/lib/supabase/server";
import {
  ALL_LISTING_STATUSES,
  type ListingStatus,
} from "@/lib/listing-status";
import { buildListingCaption } from "@/lib/post-composer";
import { apartmentPublicUrl } from "@/lib/public-url";
import { filterListingFeatures } from "@/lib/listing-features";
import { parseCommissionFormData } from "@/lib/deal-commission";
import { captureServer } from "@/lib/analytics-server";
import { getFacebookPageCredentials } from "@/lib/data/integrations";
import {
  clearListingFacebookPosts,
  recordListingFacebookGroupPost,
  recordListingFacebookPagePost,
} from "@/lib/data/facebook-posts";
import {
  FACEBOOK_POST_MAX_PHOTOS,
  publishPagePost,
} from "@/lib/facebook-publish";

export type ListingDealActionState = { error?: string; ok?: boolean };

export type ListingFormState = { error?: string; ok?: boolean };

export type PublishFacebookState = {
  error?: string;
  ok?: boolean;
  postId?: string;
  permalink?: string | null;
  batchId?: string;
};

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

function parseFeatures(raw: string): string[] {
  return filterListingFeatures(
    raw
      .split(/[\n,]/)
      .map((s) => s.trim())
      .filter(Boolean)
  );
}

async function parsePrice(formData: FormData): Promise<
  | {
      price: number;
      price_display: string;
      price_amount: number;
      price_currency: PriceCurrency;
      price_usd: number;
      price_vnd: number;
    }
  | { error: string }
> {
  const amountRaw = String(formData.get("price_amount") ?? formData.get("price") ?? "").trim();
  const currencyRaw = String(formData.get("price_currency") ?? "USD").trim().toUpperCase();
  const amount = Number(amountRaw);
  if (!Number.isFinite(amount) || amount <= 0) {
    return { error: "Enter a monthly price (number)." };
  }
  if (currencyRaw !== "USD" && currencyRaw !== "VND") {
    return { error: "Choose USD or VND." };
  }
  const currency = currencyRaw as PriceCurrency;
  const rate = await getUsdVndRate();
  const converted = convertPrice(amount, currency, rate);
  return {
    price: converted.usd,
    price_display: converted.price_display,
    price_amount: currency === "USD" ? converted.usd : converted.vnd,
    price_currency: currency,
    price_usd: converted.usd,
    price_vnd: converted.vnd,
  };
}

function parseAvailableFrom(formData: FormData): string | null | { error: string } {
  const raw = String(formData.get("available_from") ?? "").trim();
  if (!raw) return null;
  // Expect YYYY-MM-DD from <input type="date">
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return { error: "Available from must be a valid date." };
  }
  return raw;
}

const PROPERTY_TYPES: readonly PropertyType[] = [
  "apartment",
  "house",
  "villa",
  "serviced",
];

const UTILITIES_INCLUDED: readonly UtilitiesIncluded[] = [
  "not_included",
  "partial",
  "included",
];

function parseOptionalMonths(
  formData: FormData,
  key: string,
  label: string
): number | null | { error: string } {
  const raw = String(formData.get(key) ?? "").trim();
  if (!raw) return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) {
    return { error: `${label} must be a number ≥ 0.` };
  }
  return n;
}

function parsePropertyType(formData: FormData): PropertyType | null | { error: string } {
  const raw = String(formData.get("property_type") ?? "").trim();
  if (!raw) return null;
  if (!(PROPERTY_TYPES as readonly string[]).includes(raw)) {
    return { error: "Invalid property type." };
  }
  return raw as PropertyType;
}

function parseUtilitiesIncluded(
  formData: FormData
): UtilitiesIncluded | null | { error: string } {
  const raw = String(formData.get("utilities_included") ?? "").trim();
  if (!raw) return null;
  if (!(UTILITIES_INCLUDED as readonly string[]).includes(raw)) {
    return { error: "Invalid utilities option." };
  }
  return raw as UtilitiesIncluded;
}

async function readListingFields(
  formData: FormData,
  opts: { isAdmin: boolean; isCreate: boolean; existingStatus?: string | null }
) {
  const title = String(formData.get("title") ?? "").trim();
  const area_id = String(formData.get("area_id") ?? "").trim();
  const description = sanitizeListingDescription(
    String(formData.get("description") ?? "")
  );
  const bedrooms = Number(formData.get("bedrooms") ?? 1);
  const bathroomsRaw = String(formData.get("bathrooms") ?? "").trim();
  const sizeRaw = String(formData.get("size_sqm") ?? "").trim();
  const features = parseFeatures(String(formData.get("features") ?? ""));
  const partner_notes = String(formData.get("partner_notes") ?? "").trim() || null;
  const main_image = String(formData.get("main_image") ?? "").trim();
  const imagesRaw = String(formData.get("images") ?? "").trim();
  const images = imagesRaw
    ? imagesRaw
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  const availableFromResult = parseAvailableFrom(formData);
  if (availableFromResult && typeof availableFromResult === "object" && "error" in availableFromResult) {
    return availableFromResult;
  }
  const available_from = availableFromResult as string | null;

  const propertyTypeResult = parsePropertyType(formData);
  if (propertyTypeResult && typeof propertyTypeResult === "object" && "error" in propertyTypeResult) {
    return propertyTypeResult;
  }
  const property_type = propertyTypeResult as PropertyType | null;

  const minLeaseResult = parseOptionalMonths(formData, "min_lease_months", "Min. lease");
  if (minLeaseResult && typeof minLeaseResult === "object" && "error" in minLeaseResult) {
    return minLeaseResult;
  }
  const min_lease_months =
    typeof minLeaseResult === "number" ? Math.round(minLeaseResult) : null;

  const depositResult = parseOptionalMonths(formData, "deposit_months", "Deposit");
  if (depositResult && typeof depositResult === "object" && "error" in depositResult) {
    return depositResult;
  }
  const deposit_months = depositResult as number | null;

  const agencyFeeResult = parseOptionalMonths(
    formData,
    "agency_fee_months",
    "Agency fee"
  );
  if (agencyFeeResult && typeof agencyFeeResult === "object" && "error" in agencyFeeResult) {
    return agencyFeeResult;
  }
  const agency_fee_months = agencyFeeResult as number | null;

  const utilitiesResult = parseUtilitiesIncluded(formData);
  if (utilitiesResult && typeof utilitiesResult === "object" && "error" in utilitiesResult) {
    return utilitiesResult;
  }
  const utilities_included = utilitiesResult as UtilitiesIncluded | null;

  if (!title) return { error: "Title is required." } as const;
  if (!area_id) return { error: "Choose an area." } as const;
  const priceResult = await parsePrice(formData);
  if ("error" in priceResult) return priceResult;

  let status: ListingStatus;
  if (opts.isCreate) {
    // New partner listings always start as draft (even if form is tampered).
    status = "draft";
  } else {
    // Empty string is a real FormData value — don't treat it as missing via ??.
    const rawStatus = formData.get("status");
    const requested =
      typeof rawStatus === "string" && rawStatus.trim()
        ? rawStatus.trim()
        : (opts.existingStatus ?? "draft");
    if (opts.isAdmin) {
      if (!(ALL_LISTING_STATUSES as readonly string[]).includes(requested)) {
        return { error: "Invalid status." } as const;
      }
      status = requested as ListingStatus;
    } else {
      // Partners cannot change status via the edit form — keep existing.
      // pending_review goes through requestListingLive; live via admin approve.
      // Never honor a partner-submitted `available` (or any other change).
      const existing = opts.existingStatus ?? "draft";
      status = (
        (ALL_LISTING_STATUSES as readonly string[]).includes(existing)
          ? existing
          : "draft"
      ) as ListingStatus;
    }
  }

  return {
    title,
    area_id,
    description,
    ...priceResult,
    bedrooms: Number.isFinite(bedrooms) && bedrooms >= 0 ? Math.round(bedrooms) : 1,
    bathrooms: bathroomsRaw ? Number(bathroomsRaw) : null,
    size_sqm: sizeRaw ? Number(sizeRaw) : null,
    features,
    available_from,
    property_type,
    min_lease_months,
    deposit_months,
    agency_fee_months,
    utilities_included,
    status,
    partner_notes,
    main_image:
      main_image ||
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&q=80",
    images,
  } as const;
}

function revalidateListingPaths(id?: string) {
  revalidatePath("/");
  revalidatePath("/listings");
  revalidatePath("/admin/approvals");
  if (id) {
    revalidatePath(`/listings/${id}`);
    revalidatePath(`/listings/${id}/edit`);
  }
}

export async function createListing(
  _prev: ListingFormState,
  formData: FormData
): Promise<ListingFormState> {
  const session = await requirePartner();
  if (!session) return { error: "Unauthorized." };

  const fields = await readListingFields(formData, {
    isAdmin: session.isAdmin,
    isCreate: true,
  });
  if ("error" in fields) return { error: fields.error };

  const supabase = await createClient();
  const public_slug = `${slugify(fields.title)}-${Math.random().toString(36).slice(2, 7)}`;

  const { data, error } = await supabase
    .from("apartments")
    .insert({
      ...fields,
      status: "draft",
      estate_company_id: session.estateCompanyId,
      public_slug,
      last_bumped_at: new Date().toISOString(),
      // Drafts are not public — validity check filled when approved live
      last_validity_check: null,
      sort_order: 0,
    })
    .select("id")
    .single();

  if (error || !data) return { error: error?.message ?? "Could not create listing." };

  await captureServer(
    "listing_created",
    {
      listing_id: data.id,
      bedrooms: fields.bedrooms,
      price_usd: fields.price_usd,
      price_currency: fields.price_currency,
      has_min_lease: fields.min_lease_months != null,
      has_deposit: fields.deposit_months != null,
      has_agency_fee: fields.agency_fee_months != null,
      has_utilities: fields.utilities_included != null,
      property_type: fields.property_type,
    },
    session,
  );

  revalidateListingPaths(data.id);
  redirect(`/listings/${data.id}`);
}

export async function updateListing(
  id: string,
  _prev: ListingFormState,
  formData: FormData
): Promise<ListingFormState> {
  const session = await requirePartner();
  if (!session) return { error: "Unauthorized." };

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("apartments")
    .select("status")
    .eq("id", id)
    .eq("estate_company_id", session.estateCompanyId)
    .maybeSingle();
  if (!existing) return { error: "Listing not found." };

  const fields = await readListingFields(formData, {
    isAdmin: session.isAdmin,
    isCreate: false,
    existingStatus: existing.status as string | null,
  });
  if ("error" in fields) return { error: fields.error };

  const patch: Record<string, unknown> = {
    ...fields,
    updated_at: new Date().toISOString(),
  };
  // Match updateListingStatus side-effects when admin changes lifecycle status.
  if (session.isAdmin) {
    if (fields.status === "available") {
      patch.last_bumped_at = new Date().toISOString();
      patch.last_validity_check = new Date().toISOString();
      patch.live_rejection_note = null;
    }
    if (fields.status === "draft") {
      patch.live_requested_at = null;
    }
  }

  const { data, error } = await supabase
    .from("apartments")
    .update(patch)
    .eq("id", id)
    .eq("estate_company_id", session.estateCompanyId)
    .select("id, status")
    .maybeSingle();

  if (error) return { error: error.message };
  if (!data) return { error: "Could not update listing." };
  if (session.isAdmin && data.status !== fields.status) {
    return { error: "Status could not be updated." };
  }

  await captureServer(
    "listing_updated",
    {
      listing_id: id,
      has_min_lease: fields.min_lease_months != null,
      has_deposit: fields.deposit_months != null,
      has_agency_fee: fields.agency_fee_months != null,
      has_utilities: fields.utilities_included != null,
      property_type: fields.property_type,
    },
    session,
  );

  revalidateListingPaths(id);
  return { ok: true };
}

export async function updateListingStatus(id: string, status: string): Promise<ListingFormState> {
  const session = await requirePartner();
  if (!session) return { error: "Unauthorized." };

  if (!session.isAdmin) {
    return { error: "Only admins can change listing status." };
  }

  if (!(ALL_LISTING_STATUSES as readonly string[]).includes(status)) {
    return { error: "Invalid status." };
  }

  const supabase = await createClient();
  const patch: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  };
  if (status === "available" && session.isAdmin) {
    patch.last_bumped_at = new Date().toISOString();
    patch.last_validity_check = new Date().toISOString();
    patch.live_rejection_note = null;
  }
  if (status === "draft") {
    patch.live_requested_at = null;
  }

  const { data, error } = await supabase
    .from("apartments")
    .update(patch)
    .eq("id", id)
    .eq("estate_company_id", session.estateCompanyId)
    .select("id, status")
    .maybeSingle();

  if (error) return { error: error.message };
  if (!data) return { error: "Could not update listing status." };
  if (data.status !== status) {
    return { error: "Status could not be updated." };
  }

  await captureServer(
    "listing_status_changed",
    { listing_id: id, status },
    session,
  );

  revalidateListingPaths(id);
  return { ok: true };
}

/** Partner: draft (or rejected) → pending_review. */
export async function requestListingLive(id: string): Promise<ListingFormState> {
  const session = await requirePartner();
  if (!session) return { error: "Unauthorized." };

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("apartments")
    .select("id, status")
    .eq("id", id)
    .eq("estate_company_id", session.estateCompanyId)
    .maybeSingle();

  if (!existing) return { error: "Listing not found." };
  if (existing.status !== "draft" && existing.status !== "pending_review") {
    return { error: "Only draft listings can be submitted for review." };
  }

  const now = new Date().toISOString();
  const { error } = await supabase
    .from("apartments")
    .update({
      status: "pending_review",
      live_requested_at: now,
      live_rejection_note: null,
      updated_at: now,
    })
    .eq("id", id)
    .eq("estate_company_id", session.estateCompanyId);

  if (error) return { error: error.message };

  await captureServer(
    "listing_submitted_for_review",
    { listing_id: id },
    session,
  );

  revalidateListingPaths(id);
  return { ok: true };
}

/** Admin: pending_review → available (+ refresh validity). */
export async function approveListingLive(id: string): Promise<ListingFormState> {
  const admin = await requireAdmin();
  if (!admin) return { error: "Unauthorized." };

  const service = getServiceRoleClient();
  const supabase = service ?? (await createClient());
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("apartments")
    .update({
      status: "available",
      last_validity_check: now,
      last_bumped_at: now,
      live_rejection_note: null,
      updated_at: now,
    })
    .eq("id", id)
    .eq("status", "pending_review")
    .select("id")
    .maybeSingle();

  if (error) return { error: error.message };
  if (!data) return { error: "Listing is not pending review." };

  await captureServer("listing_approved", { listing_id: id });

  revalidateListingPaths(id);
  return { ok: true };
}

/** Admin: pending_review → draft with optional note (list shows Rejected when note is set). */
export async function rejectListingLive(
  id: string,
  note?: string
): Promise<ListingFormState> {
  const admin = await requireAdmin();
  if (!admin) return { error: "Unauthorized." };

  const service = getServiceRoleClient();
  const supabase = service ?? (await createClient());
  const now = new Date().toISOString();
  const rejectionNote = note?.trim() || "Rejected";

  const { data, error } = await supabase
    .from("apartments")
    .update({
      status: "draft",
      live_rejection_note: rejectionNote,
      live_requested_at: null,
      updated_at: now,
    })
    .eq("id", id)
    .eq("status", "pending_review")
    .select("id")
    .maybeSingle();

  if (error) return { error: error.message };
  if (!data) return { error: "Listing is not pending review." };

  await captureServer("listing_rejected", {
    listing_id: id,
    has_custom_note: Boolean(note?.trim()),
  });

  revalidateListingPaths(id);
  return { ok: true };
}

/**
 * One-click validity confirmation from the Home task feed.
 * Partners may refresh validity on already-available listings, or mark reserved/rented.
 * They cannot promote a non-available listing to available.
 */
export async function confirmListingValidity(
  id: string,
  outcome: "available" | "reserved" | "rented"
): Promise<ListingFormState> {
  const session = await requirePartner();
  if (!session) return { error: "Unauthorized." };

  const allowed = ["available", "reserved", "rented"] as const;
  if (!allowed.includes(outcome)) return { error: "Invalid outcome." };

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("apartments")
    .select("status")
    .eq("id", id)
    .eq("estate_company_id", session.estateCompanyId)
    .maybeSingle();

  if (!existing) return { error: "Listing not found." };

  if (outcome === "available") {
    // Only refresh validity — never promote draft/pending/reserved → available
    if (existing.status && existing.status !== "available") {
      return { error: "Partners cannot set a listing live — use Request to set live." };
    }
  }

  const now = new Date().toISOString();
  const patch: Record<string, unknown> = {
    status: outcome,
    last_validity_check: now,
    updated_at: now,
  };
  if (outcome === "available") {
    patch.last_bumped_at = now;
  }

  const { error } = await supabase
    .from("apartments")
    .update(patch)
    .eq("id", id)
    .eq("estate_company_id", session.estateCompanyId);

  if (error) return { error: error.message };

  await captureServer(
    "listing_validity_confirmed",
    { listing_id: id, outcome },
    session,
  );

  revalidateListingPaths(id);
  return { ok: true };
}

/** Extract storage object paths from public apartments-bucket URLs for this company. */
function apartmentStoragePaths(urls: string[], estateCompanyId: string): string[] {
  const marker = "/storage/v1/object/public/apartments/";
  const paths: string[] = [];
  for (const url of urls) {
    const idx = url.indexOf(marker);
    if (idx === -1) continue;
    const path = decodeURIComponent(url.slice(idx + marker.length).split("?")[0] ?? "");
    if (path && path.startsWith(`${estateCompanyId}/`)) paths.push(path);
  }
  return [...new Set(paths)];
}

/**
 * Hard-delete a listing scoped to the active studio company.
 * Drafts cascade; partner_deals.apartment_id is set null by FK.
 */
export async function setListingMainImage(
  id: string,
  imageUrl: string
): Promise<ListingFormState> {
  const session = await requirePartner();
  if (!session) return { error: "Unauthorized." };

  const url = imageUrl.trim();
  if (!url) return { error: "Missing image." };

  const supabase = await createClient();
  const { data: existing, error: fetchError } = await supabase
    .from("apartments")
    .select("id, estate_company_id, main_image, images")
    .eq("id", id)
    .eq("estate_company_id", session.estateCompanyId)
    .maybeSingle();

  if (fetchError) return { error: fetchError.message };
  if (!existing || existing.estate_company_id !== session.estateCompanyId) {
    return { error: "Listing not found." };
  }

  const main = (existing.main_image as string | null) ?? null;
  const gallery = [main, ...((existing.images as string[] | null) ?? [])].filter(
    (u): u is string => Boolean(u?.trim())
  );
  if (!gallery.includes(url)) {
    return { error: "That photo is not part of this listing." };
  }
  if (main === url) return { ok: true };

  const rest = gallery.filter((u) => u !== url);
  const { error } = await supabase
    .from("apartments")
    .update({
      main_image: url,
      images: rest,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("estate_company_id", session.estateCompanyId);

  if (error) return { error: error.message };

  await captureServer("listing_main_image_set", { listing_id: id }, session);

  revalidateListingPaths(id);
  return { ok: true };
}

/** Replace main + gallery photos for a listing (Photos tab). */
export async function saveListingPhotos(
  id: string,
  mainImage: string,
  images: string[]
): Promise<ListingFormState> {
  const session = await requirePartner();
  if (!session) return { error: "Unauthorized." };

  const main = mainImage.trim();
  const gallery = images.map((u) => u.trim()).filter(Boolean).filter((u) => u !== main);

  const supabase = await createClient();
  const { data: existing, error: fetchError } = await supabase
    .from("apartments")
    .select("id, estate_company_id")
    .eq("id", id)
    .eq("estate_company_id", session.estateCompanyId)
    .maybeSingle();

  if (fetchError) return { error: fetchError.message };
  if (!existing) return { error: "Listing not found." };

  const { error } = await supabase
    .from("apartments")
    .update({
      main_image:
        main ||
        "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&q=80",
      images: gallery,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("estate_company_id", session.estateCompanyId);

  if (error) return { error: error.message };

  await captureServer(
    "listing_photos_saved",
    {
      listing_id: id,
      photo_count: gallery.length + (main ? 1 : 0),
    },
    session,
  );

  revalidateListingPaths(id);
  return { ok: true };
}

/**
 * Hard-delete a listing scoped to the active studio company.
 * Drafts cascade; partner_deals.apartment_id is set null by FK.
 */
export async function deleteListing(id: string): Promise<ListingFormState> {
  const session = await requirePartner();
  if (!session) return { error: "Unauthorized." };

  const supabase = await createClient();
  const { data: existing, error: fetchError } = await supabase
    .from("apartments")
    .select("id, estate_company_id, main_image, images")
    .eq("id", id)
    .eq("estate_company_id", session.estateCompanyId)
    .maybeSingle();

  if (fetchError) return { error: fetchError.message };
  if (!existing || existing.estate_company_id !== session.estateCompanyId) {
    return { error: "Listing not found." };
  }

  const imageUrls = [
    existing.main_image as string | null,
    ...((existing.images as string[] | null) ?? []),
  ].filter((u): u is string => Boolean(u));
  const storagePaths = apartmentStoragePaths(imageUrls, session.estateCompanyId);

  const { data: deleted, error } = await supabase
    .from("apartments")
    .delete()
    .eq("id", id)
    .eq("estate_company_id", session.estateCompanyId)
    .select("id")
    .maybeSingle();

  if (error) return { error: error.message };
  if (!deleted) return { error: "Could not delete listing." };

  if (storagePaths.length > 0) {
    await supabase.storage.from("apartments").remove(storagePaths);
  }

  await captureServer("listing_deleted", { listing_id: id }, session);

  revalidatePath("/");
  revalidatePath("/listings");
  revalidatePath("/admin/approvals");
  redirect("/listings?deleted=1");
}

export async function savePostDraft(
  apartmentId: string,
  caption: string
): Promise<ListingFormState> {
  const session = await requirePartner();
  if (!session) return { error: "Unauthorized." };

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("listing_post_drafts")
    .select("id")
    .eq("apartment_id", apartmentId)
    .eq("estate_company_id", session.estateCompanyId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing?.id) {
    const { error } = await supabase
      .from("listing_post_drafts")
      .update({
        caption,
        status: "ready",
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase.from("listing_post_drafts").insert({
      apartment_id: apartmentId,
      estate_company_id: session.estateCompanyId,
      caption,
      status: "ready",
    });
    if (error) {
      if (error.message.toLowerCase().includes("listing_post_drafts")) {
        return { error: "Post drafts table missing — run supabase/12-partner-portal.sql." };
      }
      return { error: error.message };
    }
  }

  await captureServer(
    "post_draft_saved",
    { listing_id: apartmentId },
    session,
  );

  revalidatePath(`/listings/${apartmentId}`);
  return { ok: true };
}

/**
 * Publish listing caption + selected public image URLs to the connected Facebook Page.
 * Image list is for this post only — does not change listing photos.
 */
export async function publishListingToFacebook(params: {
  listingId: string;
  caption: string;
  imageUrls: string[];
  batchId?: string;
}): Promise<PublishFacebookState> {
  const session = await requirePartner();
  if (!session) return { error: "Unauthorized." };

  const caption = params.caption.trim();
  if (!caption) return { error: "Caption is required." };

  const batchId = params.batchId?.trim() || crypto.randomUUID();

  const supabase = await createClient();
  const { data: listing, error: listingError } = await supabase
    .from("apartments")
    .select("id, main_image, images")
    .eq("id", params.listingId)
    .eq("estate_company_id", session.estateCompanyId)
    .maybeSingle();

  if (listingError) return { error: listingError.message };
  if (!listing) return { error: "Listing not found." };

  const allowed = new Set(
    [listing.main_image, ...((listing.images as string[] | null) ?? [])]
      .map((u) => (typeof u === "string" ? u.trim() : ""))
      .filter(Boolean),
  );

  const imageUrls = [
    ...new Set(
      params.imageUrls
        .map((u) => u.trim())
        .filter((u) => u && allowed.has(u)),
    ),
  ].slice(0, FACEBOOK_POST_MAX_PHOTOS);

  const creds = await getFacebookPageCredentials(session.estateCompanyId);
  if ("error" in creds) return { error: creds.error };

  try {
    const published = await publishPagePost({
      pageId: creds.pageId,
      accessToken: creds.accessToken,
      message: caption,
      imageUrls,
    });

    const recorded = await recordListingFacebookPagePost({
      apartmentId: params.listingId,
      estateCompanyId: session.estateCompanyId,
      batchId,
      facebookPostId: published.postId,
      permalink: published.permalink,
      photoCount: imageUrls.length,
      caption,
      postedBy: session.user.id,
    });
    if (recorded.error) {
      console.error("recordListingFacebookPagePost", recorded.error);
    }

    await captureServer(
      "facebook_listing_posted",
      {
        listing_id: params.listingId,
        photo_count: imageUrls.length,
        has_permalink: Boolean(published.permalink),
      },
      session,
    );

    revalidatePath("/");
    revalidatePath(`/listings/${params.listingId}`);
    return {
      ok: true,
      postId: published.postId,
      permalink: published.permalink,
      batchId,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Facebook publish failed.";
    console.error("publishListingToFacebook", message);
    return { error: message };
  }
}

export async function recordFacebookGroupPosted(params: {
  listingId: string;
  batchId: string;
  groupId: string | null;
  groupName: string;
  groupUrl: string;
  photoCount: number;
  caption: string;
}): Promise<ListingFormState & { batchId?: string }> {
  const session = await requirePartner();
  if (!session) return { error: "Unauthorized." };

  const batchId = params.batchId.trim() || crypto.randomUUID();
  const result = await recordListingFacebookGroupPost({
    apartmentId: params.listingId,
    estateCompanyId: session.estateCompanyId,
    batchId,
    facebookGroupId: params.groupId,
    groupName: params.groupName,
    groupUrl: params.groupUrl,
    photoCount: params.photoCount,
    caption: params.caption,
    postedBy: session.user.id,
  });
  if (result.error) return { error: result.error };

  await captureServer(
    "facebook_group_post_recorded",
    {
      listing_id: params.listingId,
      has_group_id: Boolean(params.groupId),
    },
    session,
  );

  revalidatePath("/");
  revalidatePath(`/listings/${params.listingId}`);
  return { ok: true, batchId };
}

export async function clearListingFacebookHistory(
  listingId: string,
  olderThanDays?: number,
): Promise<ListingFormState & { cleared?: number }> {
  const session = await requirePartner();
  if (!session) return { error: "Unauthorized." };

  const result = await clearListingFacebookPosts(
    session.estateCompanyId,
    listingId,
    olderThanDays != null ? { olderThanDays } : undefined,
  );
  if (result.error) return { error: result.error };

  await captureServer(
    "facebook_post_history_cleared",
    {
      listing_id: listingId,
      cleared: result.cleared ?? 0,
      older_than_days: olderThanDays ?? null,
    },
    session,
  );

  revalidatePath("/");
  revalidatePath(`/listings/${listingId}`);
  return { ok: true, cleared: result.cleared };
}

export async function getGeneratedCaption(apartmentId: string): Promise<string | null> {
  const session = await requirePartner();
  if (!session) return null;

  const supabase = await createClient();
  const { data: apt } = await supabase
    .from("apartments")
    .select("*")
    .eq("id", apartmentId)
    .eq("estate_company_id", session.estateCompanyId)
    .single();
  if (!apt) return null;

  let area: { name: string; vibe?: string | null } | null = null;
  if (apt.area_id) {
    const { data: areaRow } = await supabase
      .from("areas")
      .select("name, vibe")
      .eq("id", apt.area_id)
      .maybeSingle();
    if (areaRow) area = areaRow;
  }

  const url = apartmentPublicUrl(apt.id, apt.public_slug);
  return buildListingCaption(apt as Apartment, area, url);
}

/**
 * Upsert expected commission on a listing-scoped deal (no contact).
 * Used for “possible commission” before anyone is linked.
 */
export async function saveListingExpectedCommission(
  listingId: string,
  _prev: ListingDealActionState,
  formData: FormData
): Promise<ListingDealActionState> {
  const session = await requirePartner();
  if (!session) return { error: "Unauthorized." };
  if (!listingId?.trim()) return { error: "Missing listing." };

  const commission = parseCommissionFormData(formData);
  if ("error" in commission) return { error: commission.error };

  const supabase = await createClient();
  const { data: listing } = await supabase
    .from("apartments")
    .select("id")
    .eq("id", listingId)
    .eq("estate_company_id", session.estateCompanyId)
    .maybeSingle();
  if (!listing) return { error: "Listing not found." };

  const { data: existing } = await supabase
    .from("partner_deals")
    .select("id")
    .eq("estate_company_id", session.estateCompanyId)
    .eq("apartment_id", listingId)
    .is("contact_id", null)
    .maybeSingle();

  const payload = {
    notes: commission.notes,
    expected_commission_usd: commission.expected_commission_usd,
    expected_commission_pct: commission.expected_commission_pct,
    updated_at: new Date().toISOString(),
  };

  if (existing) {
    const { error } = await supabase
      .from("partner_deals")
      .update(payload)
      .eq("id", existing.id);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase.from("partner_deals").insert({
      estate_company_id: session.estateCompanyId,
      apartment_id: listingId,
      contact_id: null,
      stage: "inquiry",
      ...payload,
    });
    if (error) {
      if (error.message.toLowerCase().includes("partner_deals")) {
        return { error: "Deals table missing — run supabase/12-partner-portal.sql." };
      }
      return { error: error.message };
    }
  }

  await captureServer(
    "listing_commission_saved",
    { listing_id: listingId },
    session,
  );

  revalidateListingPaths(listingId);
  revalidatePath("/contacts");
  return { ok: true };
}

/** Connect a contact to this listing with optional commission fields. */
export async function connectContactToListing(
  listingId: string,
  _prev: ListingDealActionState,
  formData: FormData
): Promise<ListingDealActionState> {
  const session = await requirePartner();
  if (!session) return { error: "Unauthorized." };
  if (!listingId?.trim()) return { error: "Missing listing." };

  const contactId = String(formData.get("contact_id") ?? "").trim();
  if (!contactId) return { error: "Pick a contact to connect." };
  const commission = parseCommissionFormData(formData);
  if ("error" in commission) return { error: commission.error };

  const supabase = await createClient();
  const { data: listing } = await supabase
    .from("apartments")
    .select("id")
    .eq("id", listingId)
    .eq("estate_company_id", session.estateCompanyId)
    .maybeSingle();
  if (!listing) return { error: "Listing not found." };

  const { data: contact } = await supabase
    .from("partner_contacts")
    .select("id")
    .eq("id", contactId)
    .eq("estate_company_id", session.estateCompanyId)
    .maybeSingle();
  if (!contact) return { error: "Contact not found." };

  const { data: existing } = await supabase
    .from("partner_deals")
    .select("id")
    .eq("estate_company_id", session.estateCompanyId)
    .eq("contact_id", contactId)
    .eq("apartment_id", listingId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("partner_deals")
      .update({
        notes: commission.notes,
        expected_commission_usd: commission.expected_commission_usd,
        expected_commission_pct: commission.expected_commission_pct,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase.from("partner_deals").insert({
      estate_company_id: session.estateCompanyId,
      contact_id: contactId,
      apartment_id: listingId,
      notes: commission.notes,
      expected_commission_usd: commission.expected_commission_usd,
      expected_commission_pct: commission.expected_commission_pct,
      stage: "inquiry",
    });
    if (error) {
      if (error.message.toLowerCase().includes("partner_deals")) {
        return { error: "Deals table missing — run supabase/12-partner-portal.sql." };
      }
      return { error: error.message };
    }
  }

  await captureServer(
    "deal_contact_connected",
    { listing_id: listingId, contact_id: contactId },
    session,
  );

  revalidateListingPaths(listingId);
  revalidatePath("/contacts");
  revalidatePath(`/contacts/${contactId}`);
  return { ok: true };
}
