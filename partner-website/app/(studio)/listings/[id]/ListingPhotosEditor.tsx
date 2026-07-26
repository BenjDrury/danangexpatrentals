"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { Button, Section } from "@/components/ui";
import { saveListingPhotos, setListingMainImage } from "../actions";

type Props = {
  listingId: string;
  estateCompanyId: string;
  mainImage: string | null | undefined;
  images: string[] | null | undefined;
};

export function ListingPhotosEditor({
  listingId,
  estateCompanyId,
  mainImage,
  images,
}: Props) {
  const { t } = useLocale();
  const router = useRouter();
  const [main, setMain] = useState(mainImage ?? "");
  const [gallery, setGallery] = useState<string[]>(images ?? []);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const all = [main, ...gallery].filter((u) => Boolean(u?.trim()));

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
    setMessage(null);
    const url = await uploadFile(file);
    setUploading(false);
    if (url) {
      if (main) setGallery((prev) => [main, ...prev.filter((u) => u !== url)]);
      setMain(url);
    }
    e.target.value = "";
  }

  async function onGalleryFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploading(true);
    setUploadError(null);
    setMessage(null);
    const urls: string[] = [];
    for (const file of files) {
      const url = await uploadFile(file);
      if (url) urls.push(url);
    }
    setUploading(false);
    if (urls.length) {
      setGallery((prev) => [...prev, ...urls]);
      if (!main && urls[0]) {
        setMain(urls[0]);
        setGallery((prev) => prev.filter((u) => u !== urls[0]));
      }
    }
    e.target.value = "";
  }

  function removeUrl(url: string) {
    setMessage(null);
    if (url === main) {
      const next = gallery[0] ?? "";
      setMain(next);
      setGallery(gallery.slice(1));
    } else {
      setGallery((prev) => prev.filter((u) => u !== url));
    }
  }

  function makeMain(url: string) {
    if (url === main) return;
    setMessage(null);
    setGallery((prev) => [main, ...prev.filter((u) => u !== url)].filter(Boolean));
    setMain(url);
  }

  function save() {
    setMessage(null);
    startTransition(async () => {
      const result = await saveListingPhotos(listingId, main, gallery);
      if (result.error) {
        setMessage(result.error);
        return;
      }
      setMessage(t("form.saved"));
      router.refresh();
    });
  }

  function setMainNow(url: string) {
    setMessage(null);
    makeMain(url);
    startTransition(async () => {
      const nextGallery = [main, ...gallery].filter((u) => u && u !== url);
      const result = await setListingMainImage(listingId, url);
      if (result.error) {
        // Fall back to full save if set-main fails (e.g. unsaved uploads)
        const saveResult = await saveListingPhotos(listingId, url, nextGallery);
        if (saveResult.error) {
          setMessage(saveResult.error);
          return;
        }
      } else {
        setMain(url);
        setGallery(nextGallery);
      }
      setMessage(t("form.saved"));
      router.refresh();
    });
  }

  return (
    <Section
      title={t("form.photos")}
      description={t("form.photosHint")}
      actions={
        <Button
          type="button"
          size="sm"
          disabled={pending || uploading}
          onClick={save}
        >
          {pending ? t("form.saving") : t("form.saveChanges")}
        </Button>
      }
    >
      {main ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={main}
          alt=""
          className="h-40 w-full rounded-md object-cover sm:h-48"
        />
      ) : (
        <div className="flex h-32 items-center justify-center rounded-md bg-sand text-sm text-muted">
          {t("form.noMainPhoto")}
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        <label className="inline-flex cursor-pointer rounded-md border border-line bg-foam px-3 py-1.5 text-sm font-medium text-charcoal transition hover:border-ocean/40">
          {uploading ? t("form.uploading") : t("form.uploadMain")}
          <input type="file" accept="image/*" className="hidden" onChange={onMainFile} />
        </label>
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
      </div>

      {all.length > 0 ? (
        <ul className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
          {all.map((url) => {
            const isMain = url === main;
            return (
              <li key={url} className="group relative aspect-square overflow-hidden rounded-md bg-sand">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="size-full object-cover" />
                {isMain ? (
                  <span className="absolute left-1 top-1 rounded bg-ocean/90 px-1 py-0.5 text-[10px] font-semibold uppercase text-white">
                    {t("gallery.mainBadge")}
                  </span>
                ) : null}
                <div className="absolute inset-x-0 bottom-0 flex gap-1 bg-charcoal/70 p-1 opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100">
                  {!isMain ? (
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => setMainNow(url)}
                      className="flex-1 rounded bg-white/90 px-1 py-0.5 text-[10px] font-semibold text-charcoal"
                    >
                      {t("gallery.setMain")}
                    </button>
                  ) : null}
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => removeUrl(url)}
                    className="rounded bg-coral/90 px-1.5 py-0.5 text-[10px] font-semibold text-white"
                  >
                    {t("form.removePhoto")}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}

      {uploadError ? (
        <p className="mt-3 text-sm text-red-700" role="alert">
          {uploadError}
        </p>
      ) : null}
      {message ? (
        <p
          className={`mt-3 text-sm ${message === t("form.saved") ? "text-palm" : "text-red-700"}`}
          role="status"
        >
          {message}
        </p>
      ) : null}
    </Section>
  );
}
