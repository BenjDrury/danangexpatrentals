"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { capture } from "@/lib/analytics";

const GRID_LIMIT = 7;

type Props = {
  title: string;
  images: string[];
  apartmentId: string;
  areaId?: string;
};

export function ApartmentGallery({
  title,
  images,
  apartmentId,
  areaId,
}: Props) {
  const gallery = images.filter((url): url is string => Boolean(url?.trim()));
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const open = useCallback(
    (index: number) => {
      setOpenIndex(index);
      capture("listing_gallery_opened", {
        apartment_id: apartmentId,
        area_id: areaId ?? null,
        image_index: index,
        image_count: gallery.length,
      });
    },
    [apartmentId, areaId, gallery.length]
  );

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
  const gridImages = gallery.slice(0, GRID_LIMIT);
  const hiddenCount = Math.max(0, gallery.length - GRID_LIMIT);

  return (
    <>
      <div className="flex-1 space-y-4">
        <button
          type="button"
          onClick={() => open(0)}
          className="relative aspect-[4/3] w-full cursor-zoom-in overflow-hidden rounded-2xl bg-sand text-left transition hover:opacity-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-ocean focus-visible:ring-offset-2"
          aria-label={`View photos of ${title}`}
        >
          <Image
            src={gallery[0]}
            alt={title}
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 60vw"
            priority
          />
          {gallery.length > 1 ? (
            <span className="absolute bottom-3 right-3 rounded-lg bg-charcoal/70 px-2.5 py-1 text-xs font-medium text-white">
              {gallery.length} photos
            </span>
          ) : null}
        </button>

        {gallery.length > 1 ? (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {gridImages.slice(1).map((url, i) => {
              const index = i + 1;
              const isLastVisible =
                index === gridImages.length - 1 && hiddenCount > 0;
              return (
                <button
                  key={`${url}-${index}`}
                  type="button"
                  onClick={() => open(index)}
                  className="relative aspect-[4/3] cursor-zoom-in overflow-hidden rounded-quieter bg-sand text-left transition hover:opacity-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-ocean focus-visible:ring-offset-2"
                  aria-label={`${title} — photo ${index + 1}`}
                >
                  <Image
                    src={url}
                    alt={`${title} — photo ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 50vw, 20vw"
                  />
                  {isLastVisible ? (
                    <span className="absolute inset-0 flex items-center justify-center bg-charcoal/55 text-sm font-semibold text-white">
                      +{hiddenCount} more
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>

      {mounted &&
        openIndex != null &&
        activeUrl &&
        createPortal(
          <div
            className="fixed inset-0 z-50 h-dvh max-h-dvh overflow-hidden bg-charcoal/80 backdrop-blur-md"
            role="dialog"
            aria-modal="true"
            aria-label="Photo viewer"
            onClick={close}
          >
            <button
              type="button"
              onClick={close}
              className="absolute right-3 top-3 z-30 flex size-11 items-center justify-center rounded-full border border-white/30 bg-charcoal/80 text-2xl leading-none text-white shadow-lg transition hover:bg-white/20 sm:right-5 sm:top-5"
              aria-label="Close photo viewer"
            >
              ×
            </button>

            <div
              className="absolute inset-x-0 top-0 z-20 px-4 py-3 pr-16 text-sm font-medium text-white/90 sm:px-6 sm:pr-20"
              onClick={(e) => e.stopPropagation()}
            >
              {openIndex + 1} / {gallery.length}
            </div>

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
                    aria-label="Previous photo"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    onClick={() => go(1)}
                    className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/20 bg-white/10 px-3 py-3 text-lg text-white transition hover:bg-white/20 sm:right-4"
                    aria-label="Next photo"
                  >
                    ›
                  </button>
                </>
              ) : null}

              <div className="flex h-full max-h-dvh w-full max-w-5xl items-center justify-center pb-20 pt-14">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={activeUrl}
                  alt={`${title} — photo ${openIndex + 1}`}
                  className="max-h-full max-w-full object-contain"
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
                    className={`relative h-12 w-16 shrink-0 overflow-hidden rounded-md transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white ${
                      i === openIndex
                        ? "ring-2 ring-white"
                        : "opacity-70 hover:opacity-100"
                    }`}
                    aria-label={`Go to photo ${i + 1}`}
                    aria-current={i === openIndex ? "true" : undefined}
                  >
                    <Image
                      src={url}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
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
