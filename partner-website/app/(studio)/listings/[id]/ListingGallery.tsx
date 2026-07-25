"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { ListingImage } from "@/components/ListingImage";
import { setListingMainImage } from "../actions";
import { useLocale } from "@/lib/i18n/LocaleProvider";

type Props = {
  listingId: string;
  mainImage: string | null | undefined;
  images: string[] | null | undefined;
};

export function ListingGallery({ listingId, mainImage, images }: Props) {
  const { t } = useLocale();
  const router = useRouter();
  const gallery = [mainImage, ...(images ?? [])].filter((u): u is string => Boolean(u?.trim()));
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const close = useCallback(() => setOpenIndex(null), []);

  const go = useCallback(
    (delta: number) => {
      setOpenIndex((i) => {
        if (i == null || gallery.length === 0) return i;
        return (i + delta + gallery.length) % gallery.length;
      });
    },
    [gallery.length]
  );

  useEffect(() => {
    if (openIndex == null) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    }
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [openIndex, close, go]);

  if (gallery.length === 0) return null;

  const activeUrl = openIndex != null ? gallery[openIndex] : null;
  const isMain = activeUrl != null && activeUrl === gallery[0];

  function markMain() {
    if (activeUrl == null || isMain) return;
    setError(null);
    startTransition(async () => {
      const result = await setListingMainImage(listingId, activeUrl);
      if (result.error) {
        setError(result.error);
        return;
      }
      setOpenIndex(0);
      router.refresh();
    });
  }

  return (
    <>
      <div className="overflow-hidden rounded-soft border border-line/70 bg-sand">
        <button
          type="button"
          onClick={() => setOpenIndex(0)}
          className="relative block aspect-[16/9] w-full cursor-zoom-in text-left"
          aria-label={t("gallery.open")}
        >
          <ListingImage
            src={gallery[0]}
            alt=""
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 64rem"
            priority
          />
          {gallery.length > 1 ? (
            <span className="absolute bottom-3 right-3 rounded-md bg-charcoal/70 px-2 py-1 text-xs font-medium text-white">
              {t("gallery.count", { count: String(gallery.length) })}
            </span>
          ) : null}
        </button>

        {gallery.length > 1 ? (
          <div className="flex gap-2 overflow-x-auto border-t border-line/60 bg-white/60 p-3">
            {gallery.map((url, i) => (
              <button
                key={`${url}-${i}`}
                type="button"
                onClick={() => setOpenIndex(i)}
                className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-md ring-offset-2 transition hover:opacity-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-ocean ${
                  i === 0 ? "ring-2 ring-ocean" : "ring-1 ring-line/80"
                }`}
                aria-label={t("gallery.openAt", { n: String(i + 1) })}
              >
                <ListingImage src={url} alt="" fill className="object-cover" sizes="96px" />
                {i === 0 ? (
                  <span className="absolute left-1 top-1 rounded bg-ocean/90 px-1 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                    {t("gallery.mainBadge")}
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {mounted &&
        openIndex != null &&
        activeUrl &&
        createPortal(
          <div
            className="fixed inset-0 z-50 h-dvh max-h-dvh overflow-hidden bg-charcoal/75 backdrop-blur-md"
            role="dialog"
            aria-modal="true"
            aria-label={t("gallery.lightbox")}
            onClick={close}
          >
            <button
              type="button"
              onClick={close}
              className="absolute right-3 top-3 z-30 flex size-11 items-center justify-center rounded-full border border-white/30 bg-charcoal/80 text-2xl leading-none text-white shadow-lg transition hover:bg-white/20 sm:right-5 sm:top-5"
              aria-label={t("gallery.close")}
            >
              ×
            </button>

            <div
              className="absolute inset-x-0 top-0 z-20 flex items-center justify-between gap-3 pr-16 px-4 py-3 text-white sm:px-6 sm:pr-20"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="text-sm font-medium text-white/90">
                {t("gallery.position", {
                  current: String(openIndex + 1),
                  total: String(gallery.length),
                })}
              </p>
              <div className="flex flex-wrap items-center justify-end gap-2">
                {!isMain ? (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={markMain}
                    className="rounded-quieter bg-ocean px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-ocean-deep disabled:opacity-60"
                  >
                    {pending ? t("gallery.settingMain") : t("gallery.setMain")}
                  </button>
                ) : (
                  <span className="rounded-quieter border border-white/25 bg-white/10 px-3 py-2 text-sm text-white/90">
                    {t("gallery.isMain")}
                  </span>
                )}
              </div>
            </div>

            {error ? (
              <p
                className="absolute inset-x-0 top-14 z-20 px-4 text-center text-sm text-coral-soft sm:px-6"
                role="alert"
                onClick={(e) => e.stopPropagation()}
              >
                {error}
              </p>
            ) : null}

            <div
              className="absolute inset-0 flex items-center justify-center px-12 sm:px-16"
              onClick={(e) => e.stopPropagation()}
            >
              {gallery.length > 1 ? (
                <>
                  <button
                    type="button"
                    onClick={() => go(-1)}
                    className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/20 bg-white/10 px-3 py-3 text-lg text-white transition hover:bg-white/20 sm:left-4"
                    aria-label={t("gallery.prev")}
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    onClick={() => go(1)}
                    className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/20 bg-white/10 px-3 py-3 text-lg text-white transition hover:bg-white/20 sm:right-4"
                    aria-label={t("gallery.next")}
                  >
                    ›
                  </button>
                </>
              ) : null}

              <div className="flex h-full max-h-dvh w-full max-w-5xl items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={activeUrl}
                  alt=""
                  className="max-h-dvh max-w-full object-contain"
                />
              </div>
            </div>

            {gallery.length > 1 ? (
              <div
                className="absolute inset-x-0 bottom-0 z-20 flex justify-center gap-2 overflow-x-auto px-4 py-4"
                onClick={(e) => e.stopPropagation()}
              >
                {gallery.map((url, i) => (
                  <button
                    key={`lb-${url}-${i}`}
                    type="button"
                    onClick={() => setOpenIndex(i)}
                    className={`relative h-12 w-16 shrink-0 overflow-hidden rounded-md transition ${
                      i === openIndex ? "ring-2 ring-white" : "opacity-70 hover:opacity-100"
                    }`}
                  >
                    <ListingImage src={url} alt="" fill className="object-cover" sizes="64px" />
                  </button>
                ))}
              </div>
            ) : null}
          </div>,
          document.body
        )}
    </>
  );
}
