"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
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
  type ListingStatus,
} from "@/lib/listing-status";
import { createClient } from "@/lib/supabase/client";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { statusMessageKey } from "@/lib/i18n/messages";
import { FeaturesMultiSelect } from "@/components/FeaturesMultiSelect";
import { Button, Field, inputClass } from "@/components/ui";

type Props = {
  areas: Pick<Area, "id" | "name">[];
  estateCompanyId: string;
  listing?: Apartment;
  isAdmin?: boolean;
  /** USD→VND rate for live preview (from env or app_settings). */
  usdVndRate: number;
  /** When false (workspace Details tab), photos stay on the Photos tab. */
  includePhotos?: boolean;
};

function toDateInputValue(iso: string | null | undefined): string {
  if (!iso) return "";
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
  includePhotos = true,
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

  const currentStatus = (listing?.status ?? "draft") as ListingStatus;
  const statusOptions: ListingStatus[] = isAdmin ? [...ALL_LISTING_STATUSES] : [];
  const [statusValue, setStatusValue] = useState<ListingStatus>(currentStatus);

  useEffect(() => {
    setStatusValue(currentStatus);
  }, [currentStatus]);

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
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="main_image" value={mainImage} />
      <input type="hidden" name="images" value={gallery.join("\n")} />

      <fieldset className="space-y-3">
        <legend className="font-display text-base font-semibold text-charcoal">
          {t("form.section.basics")}
        </legend>
        <p className="text-xs text-muted">{t("form.section.basicsHint")}</p>
        <div className="grid gap-4 sm:grid-cols-2">
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

          <Field label={t("form.propertyType")} htmlFor="property_type">
            <select
              id="property_type"
              name="property_type"
              defaultValue={listing?.property_type ?? ""}
              className={inputClass}
            >
              <option value="">{t("form.propertyTypeUnspecified")}</option>
              <option value="apartment">{t("form.propertyType.apartment")}</option>
              <option value="house">{t("form.propertyType.house")}</option>
              <option value="villa">{t("form.propertyType.villa")}</option>
              <option value="serviced">{t("form.propertyType.serviced")}</option>
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
            <div className="rounded-md border border-admin/30 bg-admin-soft/50 p-3 sm:col-span-2">
              <label htmlFor="status" className="block text-sm font-medium text-admin-deep">
                {t("status.label")}
              </label>
              <select
                id="status"
                name="status"
                value={statusValue}
                onChange={(e) => setStatusValue(e.target.value as ListingStatus)}
                className="mt-1 w-full rounded-md border border-admin/35 bg-white px-3 py-2 text-sm text-charcoal outline-none focus:border-admin focus:ring-2 focus:ring-admin/25"
              >
                {statusOptions.map((s) => (
                  <option key={s} value={s}>
                    {t(statusMessageKey(s))}
                  </option>
                ))}
              </select>
              {statusValue === "reserved" ? (
                <p className="mt-1.5 text-xs text-muted">{t("status.reservedHint")}</p>
              ) : null}
            </div>
          ) : isEdit ? (
            <div className="sm:col-span-2">
              <p className="block text-sm font-medium text-charcoal">{t("status.label")}</p>
              <p className="mt-1 text-sm text-charcoal">
                {t(statusMessageKey(currentStatus))}
              </p>
              <p className="mt-1 text-xs text-muted">{t("status.partnerReadOnlyHint")}</p>
              {currentStatus === "reserved" ? (
                <p className="mt-1.5 text-xs text-muted">{t("status.reservedHint")}</p>
              ) : null}
              <input type="hidden" name="status" value={currentStatus} />
            </div>
          ) : (
            <div className="sm:col-span-2">
              <p className="block text-sm font-medium text-charcoal">{t("status.label")}</p>
              <p className="mt-1 text-sm text-muted">{t("status.newListingDraft")}</p>
              <input type="hidden" name="status" value="draft" />
            </div>
          )}
        </div>
      </fieldset>

      <fieldset className="space-y-3 border-t border-line/70 pt-5">
        <legend className="font-display text-base font-semibold text-charcoal">
          {t("form.section.pricing")}
        </legend>
        <div className="space-y-2">
          <div className="flex flex-wrap items-end gap-3">
            <Field label={t("form.priceCurrency")} htmlFor="price_currency">
              <div className="mt-1 flex rounded-md border border-line bg-foam/70 p-0.5">
                {(["USD", "VND"] as const).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCurrency(c)}
                    className={`rounded px-3 py-1.5 text-sm font-semibold transition ${
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
      </fieldset>

      <fieldset className="space-y-3 border-t border-line/70 pt-5">
        <legend className="font-display text-base font-semibold text-charcoal">
          {t("form.section.terms")}
        </legend>
        <p className="text-xs text-muted">{t("form.section.termsHint")}</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label={t("form.minLease")}
            htmlFor="min_lease_months"
            hint={t("form.minLeaseHint")}
          >
            <input
              id="min_lease_months"
              name="min_lease_months"
              type="number"
              min={0}
              step={1}
              defaultValue={listing?.min_lease_months ?? ""}
              className={inputClass}
              placeholder="6"
            />
          </Field>

          <Field
            label={t("form.depositMonths")}
            htmlFor="deposit_months"
            hint={t("form.depositMonthsHint")}
          >
            <input
              id="deposit_months"
              name="deposit_months"
              type="number"
              min={0}
              step={0.5}
              defaultValue={listing?.deposit_months ?? ""}
              className={inputClass}
              placeholder="1"
            />
          </Field>

          <Field
            label={t("form.agencyFeeMonths")}
            htmlFor="agency_fee_months"
            hint={t("form.agencyFeeMonthsHint")}
          >
            <input
              id="agency_fee_months"
              name="agency_fee_months"
              type="number"
              min={0}
              step={0.5}
              defaultValue={listing?.agency_fee_months ?? ""}
              className={inputClass}
              placeholder="0"
            />
          </Field>

          <Field
            label={t("form.utilitiesIncluded")}
            htmlFor="utilities_included"
            hint={t("form.utilitiesIncludedHint")}
          >
            <select
              id="utilities_included"
              name="utilities_included"
              defaultValue={listing?.utilities_included ?? ""}
              className={inputClass}
            >
              <option value="">{t("form.utilitiesUnspecified")}</option>
              <option value="not_included">{t("form.utilities.not_included")}</option>
              <option value="partial">{t("form.utilities.partial")}</option>
              <option value="included">{t("form.utilities.included")}</option>
            </select>
          </Field>
        </div>
      </fieldset>

      <fieldset className="space-y-3 border-t border-line/70 pt-5">
        <legend className="font-display text-base font-semibold text-charcoal">
          {t("form.section.copy")}
        </legend>
        <p className="text-xs text-muted">{t("form.section.copyHint")}</p>
        <div className="grid gap-4">
          <Field label={t("form.description")} htmlFor="description">
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
      </fieldset>

      {includePhotos ? (
        <div className="space-y-3 rounded-lg border border-line/80 bg-white/70 p-4">
          <div>
            <p className="text-sm font-medium text-charcoal">{t("form.photos")}</p>
            <p className="mt-0.5 text-xs text-muted">{t("form.photosHint")}</p>
          </div>

          {mainImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={mainImage}
              alt="Main listing"
              className="h-36 w-full rounded-md object-cover sm:h-44"
            />
          ) : (
            <div className="flex h-28 items-center justify-center rounded-md bg-sand text-sm text-muted">
              {t("form.noMainPhoto")}
            </div>
          )}

          <label className="inline-flex cursor-pointer rounded-md border border-line bg-foam px-3 py-1.5 text-sm font-medium text-charcoal transition hover:border-ocean/40">
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

          <label className="inline-flex cursor-pointer rounded-md border border-line bg-foam px-3 py-1.5 text-sm font-medium text-charcoal transition hover:border-ocean/40">
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
      ) : null}

      {(state.error || state.ok) && (
        <p className={`text-sm ${state.error ? "text-red-700" : "text-palm"}`} role="status">
          {state.error ?? t("form.saved")}
        </p>
      )}

      <Button type="submit" disabled={pending || uploading}>
        {pending
          ? t("form.saving")
          : isEdit
            ? t("form.saveChanges")
            : t("form.createListing")}
      </Button>
    </form>
  );
}
