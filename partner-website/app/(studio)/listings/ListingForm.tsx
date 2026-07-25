"use client";

import { useActionState, useMemo, useState } from "react";
import {
  convertPrice,
  formatUsd,
  formatVnd,
  type Apartment,
  type Area,
  type PriceCurrency,
} from "types";
import {
  createListing,
  updateListing,
  type ListingFormState,
} from "./actions";
import {
  ALL_LISTING_STATUSES,
} from "@/lib/listing-status";
import { createClient } from "@/lib/supabase/client";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { statusMessageKey } from "@/lib/i18n/messages";
import { FeaturesMultiSelect } from "@/components/FeaturesMultiSelect";

type Props = {
  areas: Pick<Area, "id" | "name">[];
  estateCompanyId: string;
  listing?: Apartment;
  isAdmin?: boolean;
  /** USD→VND rate for live preview (from env or app_settings). */
  usdVndRate: number;
};

function toDateInputValue(iso: string | null | undefined): string {
  if (!iso) return "";
  // Accept YYYY-MM-DD or full ISO
  return iso.slice(0, 10);
}

const initial: ListingFormState = {};

function initialCurrency(listing?: Apartment): PriceCurrency {
  if (listing?.price_currency === "VND" || listing?.price_currency === "USD") {
    return listing.price_currency;
  }
  return "USD";
}

function initialAmount(listing?: Apartment): string {
  if (listing?.price_amount != null && Number.isFinite(Number(listing.price_amount))) {
    return String(listing.price_amount);
  }
  if (listing?.price != null) return String(listing.price);
  return "";
}

export function ListingForm({
  areas,
  estateCompanyId,
  listing,
  isAdmin,
  usdVndRate,
}: Props) {
  const isEdit = Boolean(listing);
  const action = isEdit
    ? updateListing.bind(null, listing!.id)
    : createListing;
  const { t, locale } = useLocale();

  const [state, formAction, pending] = useActionState(action, initial);
  const [mainImage, setMainImage] = useState(listing?.main_image ?? "");
  const [gallery, setGallery] = useState<string[]>(listing?.images ?? []);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [currency, setCurrency] = useState<PriceCurrency>(initialCurrency(listing));
  const [amountStr, setAmountStr] = useState(initialAmount(listing));

  const convertedPreview = useMemo(() => {
    const amount = Number(amountStr);
    if (!Number.isFinite(amount) || amount <= 0) return null;
    try {
      return convertPrice(amount, currency, usdVndRate);
    } catch {
      return null;
    }
  }, [amountStr, currency, usdVndRate]);

  const currentStatus = listing?.status ?? "draft";
  const statusOptions: string[] = isAdmin ? [...ALL_LISTING_STATUSES] : [];

  async function uploadFile(file: File): Promise<string | null> {
    const supabase = createClient();
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${estateCompanyId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await supabase.storage.from("apartments").upload(path, file, {
      upsert: false,
      contentType: file.type || "image/jpeg",
    });
    if (error) {
      setUploadError(error.message);
      return null;
    }
    const { data } = supabase.storage.from("apartments").getPublicUrl(path);
    return data.publicUrl;
  }

  async function onMainFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    const url = await uploadFile(file);
    setUploading(false);
    if (url) setMainImage(url);
  }

  async function onGalleryFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploading(true);
    setUploadError(null);
    const urls: string[] = [];
    for (const file of files) {
      const url = await uploadFile(file);
      if (url) urls.push(url);
    }
    setUploading(false);
    if (urls.length) setGallery((prev) => [...prev, ...urls]);
  }

  return (
    <form action={formAction} className="space-y-8">
      <input type="hidden" name="main_image" value={mainImage} />
      <input type="hidden" name="images" value={gallery.join("\n")} />

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label={t("form.title")} htmlFor="title" className="sm:col-span-2">
          <input
            id="title"
            name="title"
            required
            defaultValue={listing?.title}
            className={inputClass}
            placeholder={t("form.titlePlaceholder")}
          />
        </Field>

        <div className="sm:col-span-2 space-y-3">
          <div className="flex flex-wrap items-end gap-3">
            <Field label={t("form.priceCurrency")} htmlFor="price_currency">
              <div className="mt-1.5 flex rounded-quieter border border-line bg-foam/70 p-0.5">
                {(["USD", "VND"] as const).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCurrency(c)}
                    className={`rounded-md px-3.5 py-2 text-sm font-semibold transition ${
                      currency === c
                        ? "bg-ocean text-white"
                        : "text-muted hover:text-charcoal"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
              <input type="hidden" name="price_currency" value={currency} />
            </Field>
            <Field label={t("form.priceAmount")} htmlFor="price_amount" className="min-w-[10rem] flex-1">
              <input
                id="price_amount"
                name="price_amount"
                type="number"
                min={1}
                step={currency === "VND" ? 1000 : 1}
                required
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                className={inputClass}
                placeholder={currency === "USD" ? "800" : "20000000"}
              />
            </Field>
          </div>
          {convertedPreview ? (
            <p className="text-sm text-muted">
              {currency === "USD"
                ? t("form.pricePreviewVnd", { amount: formatVnd(convertedPreview.vnd) })
                : t("form.pricePreviewUsd", { amount: formatUsd(convertedPreview.usd) })}
              <span className="mt-0.5 block text-xs text-muted/80">
                {t("form.priceRateNote", {
                  rate: Math.round(usdVndRate).toLocaleString(
                    locale === "vi" ? "vi-VN" : "en-US"
                  ),
                })}
              </span>
            </p>
          ) : null}
        </div>

        <Field label={t("form.bedrooms")} htmlFor="bedrooms">
          <input
            id="bedrooms"
            name="bedrooms"
            type="number"
            min={0}
            required
            defaultValue={listing?.bedrooms ?? 1}
            className={inputClass}
          />
        </Field>

        <Field label={t("form.bathrooms")} htmlFor="bathrooms">
          <input
            id="bathrooms"
            name="bathrooms"
            type="number"
            min={0}
            step={0.5}
            defaultValue={listing?.bathrooms ?? ""}
            className={inputClass}
          />
        </Field>

        <Field label={t("form.size")} htmlFor="size_sqm">
          <input
            id="size_sqm"
            name="size_sqm"
            type="number"
            min={0}
            defaultValue={listing?.size_sqm ?? ""}
            className={inputClass}
          />
        </Field>

        <Field label={t("form.area")} htmlFor="area_id">
          <select
            id="area_id"
            name="area_id"
            required
            defaultValue={listing?.area_id ?? ""}
            className={inputClass}
          >
            <option value="" disabled>
              {t("form.selectArea")}
            </option>
            {areas.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </Field>

        <Field
          label={t("form.availableFrom")}
          htmlFor="available_from"
          hint={t("form.availableFromHint")}
        >
          <input
            id="available_from"
            name="available_from"
            type="date"
            defaultValue={toDateInputValue(listing?.available_from)}
            className={inputClass}
          />
        </Field>

        {isEdit && isAdmin ? (
          <div className="rounded-quieter border border-admin/30 bg-admin-soft/50 p-3 sm:col-span-2">
            <label htmlFor="status" className="block text-sm font-medium text-admin-deep">
              {t("status.label")}
            </label>
            <select
              id="status"
              name="status"
              defaultValue={currentStatus}
              className="mt-1.5 w-full rounded-quieter border border-admin/35 bg-white px-3 py-2.5 text-sm text-charcoal outline-none focus:border-admin focus:ring-2 focus:ring-admin/25"
            >
              {statusOptions.map((s) => (
                <option key={s} value={s}>
                  {t(statusMessageKey(s))}
                </option>
              ))}
            </select>
            {currentStatus === "reserved" ? (
              <p className="mt-1.5 text-xs text-muted">{t("status.reservedHint")}</p>
            ) : null}
          </div>
        ) : isEdit ? (
          <div>
            <p className="block text-sm font-medium text-charcoal">{t("status.label")}</p>
            <p className="mt-1.5 text-sm text-charcoal">
              {t(statusMessageKey(currentStatus))}
            </p>
            <p className="mt-1 text-xs text-muted">{t("status.partnerReadOnlyHint")}</p>
            {currentStatus === "reserved" ? (
              <p className="mt-1.5 text-xs text-muted">{t("status.reservedHint")}</p>
            ) : null}
            <input type="hidden" name="status" value={currentStatus} />
          </div>
        ) : (
          <div>
            <p className="block text-sm font-medium text-charcoal">{t("status.label")}</p>
            <p className="mt-1.5 text-sm text-muted">{t("status.newListingDraft")}</p>
            <input type="hidden" name="status" value="draft" />
          </div>
        )}

        <Field label={t("form.description")} htmlFor="description" className="sm:col-span-2">
          <textarea
            id="description"
            name="description"
            rows={4}
            defaultValue={listing?.description ?? ""}
            className={inputClass}
            placeholder={t("form.descriptionPlaceholder")}
          />
        </Field>

        <FeaturesMultiSelect
          className="sm:col-span-2"
          label={t("form.features")}
          hint={t("form.featuresHint")}
          initialSelected={listing?.features ?? []}
          placeholder={t("form.featuresPlaceholder")}
          searchPlaceholder={t("form.featuresSearch")}
          selectedCountLabel={(count) => t("form.featuresSelected", { count: String(count) })}
        />

        <Field
          label={t("form.privateNotes")}
          htmlFor="partner_notes"
          hint={t("form.privateNotesHint")}
          className="sm:col-span-2"
        >
          <textarea
            id="partner_notes"
            name="partner_notes"
            rows={2}
            defaultValue={listing?.partner_notes ?? ""}
            className={inputClass}
          />
        </Field>
      </div>

      <div className="space-y-4 rounded-soft border border-line/80 bg-white/70 p-5">
        <div>
          <p className="text-sm font-medium text-charcoal">{t("form.photos")}</p>
          <p className="mt-1 text-sm text-muted">{t("form.photosHint")}</p>
        </div>

        {mainImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={mainImage}
            alt="Main listing"
            className="h-44 w-full rounded-quieter object-cover sm:h-56"
          />
        ) : (
          <div className="flex h-44 items-center justify-center rounded-quieter bg-sand text-sm text-muted sm:h-56">
            {t("form.noMainPhoto")}
          </div>
        )}

        <label className="inline-flex cursor-pointer rounded-quieter border border-line bg-foam px-3.5 py-2 text-sm font-medium text-charcoal transition hover:border-ocean/40">
          {uploading ? t("form.uploading") : t("form.uploadMain")}
          <input type="file" accept="image/*" className="hidden" onChange={onMainFile} />
        </label>

        {gallery.length > 0 && (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {gallery.map((url) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={url} src={url} alt="" className="aspect-square rounded-md object-cover" />
            ))}
          </div>
        )}

        <label className="inline-flex cursor-pointer rounded-quieter border border-line bg-foam px-3.5 py-2 text-sm font-medium text-charcoal transition hover:border-ocean/40">
          {t("form.addGallery")}
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={onGalleryFiles}
          />
        </label>

        {uploadError && (
          <p className="text-sm text-red-700" role="alert">
            {uploadError}
          </p>
        )}
      </div>

      {(state.error || state.ok) && (
        <p className={`text-sm ${state.error ? "text-red-700" : "text-palm"}`} role="status">
          {state.error ?? t("form.saved")}
        </p>
      )}

      <button
        type="submit"
        disabled={pending || uploading}
        className="rounded-quieter bg-ocean px-6 py-3 text-sm font-semibold text-white transition hover:bg-ocean-deep disabled:opacity-50"
      >
        {pending
          ? t("form.saving")
          : isEdit
            ? t("form.saveChanges")
            : t("form.createListing")}
      </button>
    </form>
  );
}

const inputClass =
  "mt-1.5 block w-full rounded-quieter border border-line bg-foam/70 px-3.5 py-2.5 text-charcoal outline-none transition focus:border-ocean focus:ring-2 focus:ring-ocean/20";

function Field({
  label,
  htmlFor,
  hint,
  className = "",
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="block text-sm font-medium text-charcoal">
        {label}
      </label>
      {hint && <p className="mt-0.5 text-xs text-muted">{hint}</p>}
      {children}
    </div>
  );
}
