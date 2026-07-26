"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { Button, inputClass } from "@/components/ui";
import type { FacebookGroupOption } from "@/lib/data/facebook-groups";
import { FACEBOOK_POST_MAX_PHOTOS } from "@/lib/facebook-publish";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { capture } from "@/lib/analytics";
import {
  publishListingToFacebook,
  recordFacebookGroupPosted,
} from "../actions";
import { addFacebookGroup } from "../../settings/actions";

function listingImageUrls(mainImage: string | null | undefined, images: string[] | null | undefined) {
  return [
    ...new Set(
      [mainImage, ...(images ?? [])]
        .map((u) => (typeof u === "string" ? u.trim() : ""))
        .filter(Boolean),
    ),
  ].slice(0, FACEBOOK_POST_MAX_PHOTOS);
}

type Step = "compose" | "confirm" | "blast" | "done";

export function FacebookPublishOverlay({
  open,
  onClose,
  listingId,
  initialCaption,
  mainImage,
  images,
  facebookConnected,
  facebookPageName,
  groups: initialGroups,
}: {
  open: boolean;
  onClose: () => void;
  listingId: string;
  initialCaption: string;
  mainImage?: string | null;
  images?: string[] | null;
  facebookConnected: boolean;
  facebookPageName: string | null;
  groups: FacebookGroupOption[];
}) {
  const { t } = useLocale();
  const allImages = useMemo(
    () => listingImageUrls(mainImage, images),
    [mainImage, images],
  );
  const [mounted, setMounted] = useState(false);
  const [groups, setGroups] = useState(initialGroups);
  const [caption, setCaption] = useState(initialCaption);
  const [selectedImages, setSelectedImages] = useState(allImages);
  const [includePage, setIncludePage] = useState(facebookConnected);
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>(() =>
    initialGroups.filter((g) => g.kind === "default").map((g) => g.groupId),
  );
  const [groupUrl, setGroupUrl] = useState("");
  const [step, setStep] = useState<Step>("compose");
  const [error, setError] = useState<string | null>(null);
  const [pagePermalink, setPagePermalink] = useState<string | null>(null);
  const [batchId, setBatchId] = useState<string>(() => crypto.randomUUID());
  const [blastIndex, setBlastIndex] = useState(0);
  const [pending, startTransition] = useTransition();

  const selectedGroups = useMemo(
    () => groups.filter((g) => selectedGroupIds.includes(g.groupId)),
    [groups, selectedGroupIds],
  );

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    setGroups(initialGroups);
    setCaption(initialCaption);
    setSelectedImages(allImages);
    setIncludePage(facebookConnected);
    setSelectedGroupIds(
      initialGroups.filter((g) => g.kind === "default").map((g) => g.groupId),
    );
    setGroupUrl("");
    setStep("compose");
    setError(null);
    setPagePermalink(null);
    setBatchId(crypto.randomUUID());
    setBlastIndex(0);
  }, [open, initialGroups, initialCaption, allImages, facebookConnected]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && step !== "blast") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, step]);

  function toggleGroup(id: string) {
    setSelectedGroupIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function removeImage(url: string) {
    setSelectedImages((prev) => prev.filter((u) => u !== url));
  }

  async function copyCaption() {
    try {
      await navigator.clipboard.writeText(caption);
    } catch {
      /* ignore */
    }
  }

  function goConfirm() {
    setError(null);
    if (!caption.trim()) {
      setError(t("composer.errorCaption"));
      return;
    }
    if (!includePage && selectedGroupIds.length === 0) {
      setError(t("composer.fb.overlay.needDestination"));
      return;
    }
    if (includePage && !facebookConnected) {
      setError(t("composer.fb.overlay.needPage"));
      return;
    }
    setStep("confirm");
  }

  function startPublish() {
    setError(null);
    const sessionBatchId = batchId || crypto.randomUUID();
    setBatchId(sessionBatchId);
    startTransition(async () => {
      let permalink: string | null = null;

      if (includePage && facebookConnected) {
        const result = await publishListingToFacebook({
          listingId,
          caption,
          imageUrls: selectedImages,
          batchId: sessionBatchId,
        });
        if (result.error) {
          setError(result.error);
          return;
        }
        permalink = result.permalink ?? null;
        setPagePermalink(permalink);
        if (result.batchId) setBatchId(result.batchId);
        capture("facebook_listing_posted", {
          listing_id: listingId,
          photo_count: selectedImages.length,
          group_count: selectedGroups.length,
        });
      }

      if (selectedGroups.length > 0) {
        await copyCaption();
        setBlastIndex(0);
        setStep("blast");
        capture("facebook_group_blast_started", {
          listing_id: listingId,
          group_count: selectedGroups.length,
          posted_to_page: includePage && facebookConnected,
        });
        return;
      }

      setStep("done");
    });
  }

  function openCurrentGroup() {
    const g = selectedGroups[blastIndex];
    if (!g) return;
    void copyCaption();
    window.open(g.url, "_blank", "noopener,noreferrer");
  }

  function nextGroup(didPost: boolean) {
    const g = selectedGroups[blastIndex];
    if (g && didPost) {
      startTransition(async () => {
        await recordFacebookGroupPosted({
          listingId,
          batchId,
          groupId: g.groupId,
          groupName: g.name,
          groupUrl: g.url,
          photoCount: selectedImages.length,
          caption,
        });
        capture("facebook_group_blast_marked", {
          listing_id: listingId,
          group_id: g.groupId,
        });
      });
    }
    if (blastIndex + 1 >= selectedGroups.length) {
      setStep("done");
      return;
    }
    setBlastIndex((i) => i + 1);
    void copyCaption();
  }

  function addGroup() {
    const url = groupUrl.trim();
    if (!url) return;
    setError(null);
    startTransition(async () => {
      const result = await addFacebookGroup(url);
      if (result.error) {
        setError(result.error);
        return;
      }
      if (result.group) {
        setGroups((prev) => {
          if (prev.some((g) => g.groupId === result.group!.groupId)) return prev;
          return [...prev, result.group!];
        });
        setSelectedGroupIds((prev) =>
          prev.includes(result.group!.groupId)
            ? prev
            : [...prev, result.group!.groupId],
        );
        setGroupUrl("");
        capture("facebook_group_added", { listing_id: listingId, source: "promote_overlay" });
      }
    });
  }

  if (!open || !mounted) return null;

  const currentGroup = selectedGroups[blastIndex] ?? null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-charcoal/60 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={t("composer.fb.overlay.title")}
      onClick={() => {
        if (step !== "blast") onClose();
      }}
    >
      <div
        className="flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl bg-foam shadow-xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex shrink-0 items-start justify-between gap-3 border-b border-line/70 px-5 py-4 sm:px-6">
          <div>
            <h2 className="font-display text-xl font-semibold text-charcoal">
              {t("composer.fb.overlay.title")}
            </h2>
            <p className="mt-0.5 text-sm text-muted">
              {step === "blast"
                ? t("composer.fb.overlay.blastProgress", {
                    current: String(blastIndex + 1),
                    total: String(selectedGroups.length),
                  })
                : t("composer.fb.overlay.subtitle")}
            </p>
          </div>
          {step !== "blast" ? (
            <button
              type="button"
              onClick={onClose}
              className="rounded-full px-2 py-1 text-2xl leading-none text-muted transition hover:bg-sand hover:text-charcoal"
              aria-label={t("composer.fb.overlay.close")}
            >
              ×
            </button>
          ) : null}
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6">
          {step === "compose" ? (
            <div className="space-y-5">
              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-charcoal">
                    {t("composer.fb.photos", { count: String(selectedImages.length) })}
                  </p>
                  {selectedImages.length < allImages.length ? (
                    <button
                      type="button"
                      onClick={() => setSelectedImages(allImages)}
                      className="text-xs font-medium text-ocean underline-offset-2 hover:underline"
                    >
                      {t("composer.fb.restorePhotos")}
                    </button>
                  ) : null}
                </div>
                {selectedImages.length === 0 ? (
                  <p className="rounded-quieter bg-sand px-3 py-2 text-sm text-muted">
                    {t("composer.fb.noPhotos")}
                  </p>
                ) : (
                  <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {selectedImages.map((url) => (
                      <li
                        key={url}
                        className="group relative aspect-square overflow-hidden rounded-quieter bg-sand"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt="" className="h-full w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeImage(url)}
                          className="absolute right-1 top-1 rounded-md bg-charcoal/80 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white"
                          aria-label={t("composer.fb.removePhoto")}
                        >
                          {t("composer.fb.removePhoto")}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                <p className="mt-2 text-xs text-muted">{t("composer.fb.photosHint")}</p>
              </div>

              <div>
                <label
                  htmlFor="fb-overlay-caption"
                  className="mb-1.5 block text-sm font-medium text-charcoal"
                >
                  {t("composer.fb.captionLabel")}
                </label>
                <textarea
                  id="fb-overlay-caption"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  rows={8}
                  className={`${inputClass} font-sans leading-relaxed`}
                />
              </div>

              <div className="space-y-3">
                <p className="text-sm font-medium text-charcoal">
                  {t("composer.fb.overlay.destinations")}
                </p>
                <label className="flex items-start gap-3 rounded-quieter border border-line/70 bg-white/80 px-3 py-2.5">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={includePage}
                    disabled={!facebookConnected}
                    onChange={(e) => setIncludePage(e.target.checked)}
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-charcoal">
                      {t("composer.fb.overlay.pageLabel", {
                        page:
                          facebookPageName?.trim() || t("composer.fb.pageFallback"),
                      })}
                    </span>
                    <span className="block text-xs text-muted">
                      {facebookConnected
                        ? t("composer.fb.overlay.pageHint")
                        : t("composer.fb.overlay.pageDisconnected")}
                    </span>
                  </span>
                </label>

                <ul className="divide-y divide-line/50 rounded-quieter border border-line/70 bg-white/80">
                  {groups.map((g) => (
                    <li key={g.groupId}>
                      <label className="flex cursor-pointer items-start gap-3 px-3 py-2.5">
                        <input
                          type="checkbox"
                          className="mt-1"
                          checked={selectedGroupIds.includes(g.groupId)}
                          onChange={() => toggleGroup(g.groupId)}
                        />
                        <span className="min-w-0">
                          <span className="block text-sm font-medium text-charcoal">
                            {g.name}
                          </span>
                          <span className="block truncate text-xs text-muted">{g.url}</span>
                          <span className="mt-0.5 block text-[11px] uppercase tracking-wide text-muted">
                            {g.kind === "default"
                              ? t("composer.fb.overlay.groupDefault")
                              : t("composer.fb.overlay.groupYours")}
                          </span>
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>

                <p className="text-xs text-muted">{t("composer.fb.overlay.groupsApiNote")}</p>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                  <label className="block min-w-0 flex-1">
                    <span className="text-sm font-medium text-charcoal">
                      {t("composer.fb.overlay.addGroup")}
                    </span>
                    <input
                      type="url"
                      value={groupUrl}
                      onChange={(e) => setGroupUrl(e.target.value)}
                      placeholder={t("settings.groups.addPlaceholder")}
                      className={`${inputClass} mt-1.5`}
                    />
                  </label>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={pending || !groupUrl.trim()}
                    onClick={addGroup}
                  >
                    {pending ? t("settings.groups.adding") : t("settings.groups.addSubmit")}
                  </Button>
                </div>
              </div>
            </div>
          ) : null}

          {step === "confirm" ? (
            <div className="space-y-4">
              <div className="rounded-quieter border border-sand bg-white/80 px-4 py-3">
                <p className="text-sm font-semibold text-charcoal">
                  {t("composer.fb.overlay.confirmTitle")}
                </p>
                <ul className="mt-2 space-y-1 text-sm text-muted">
                  {includePage ? (
                    <li>
                      {t("composer.fb.overlay.confirmPage", {
                        page:
                          facebookPageName?.trim() || t("composer.fb.pageFallback"),
                      })}
                    </li>
                  ) : null}
                  <li>
                    {t("composer.fb.overlay.confirmGroups", {
                      count: String(selectedGroups.length),
                    })}
                  </li>
                  <li>
                    {t("composer.fb.confirmPhotos", {
                      count: String(selectedImages.length),
                    })}
                  </li>
                </ul>
              </div>
              {selectedImages.length > 0 ? (
                <ul className="flex gap-2 overflow-x-auto pb-1">
                  {selectedImages.map((url) => (
                    <li
                      key={url}
                      className="h-14 w-14 shrink-0 overflow-hidden rounded-quieter bg-sand"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt="" className="h-full w-full object-cover" />
                    </li>
                  ))}
                </ul>
              ) : null}
              <pre className="max-h-40 overflow-auto whitespace-pre-wrap rounded-quieter bg-sand px-3 py-2 text-xs leading-relaxed text-charcoal">
                {caption}
              </pre>
            </div>
          ) : null}

          {step === "blast" && currentGroup ? (
            <div className="space-y-4">
              <div className="rounded-quieter border border-ocean/20 bg-ocean/5 px-4 py-3">
                <p className="text-sm font-semibold text-charcoal">{currentGroup.name}</p>
                <p className="mt-1 text-sm text-muted">
                  {t("composer.fb.overlay.blastHint")}
                </p>
              </div>
              {selectedImages.length > 0 ? (
                <div>
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">
                    {t("composer.fb.overlay.blastPhotos")}
                  </p>
                  <ul className="flex gap-2 overflow-x-auto pb-1">
                    {selectedImages.map((url) => (
                      <li
                        key={url}
                        className="h-16 w-16 shrink-0 overflow-hidden rounded-quieter bg-sand"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt="" className="h-full w-full object-cover" />
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              <pre className="max-h-36 overflow-auto whitespace-pre-wrap rounded-quieter bg-sand px-3 py-2 text-xs leading-relaxed text-charcoal">
                {caption}
              </pre>
              <p className="text-xs text-muted">{t("composer.fb.overlay.blastCopied")}</p>
            </div>
          ) : null}

          {step === "done" ? (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-palm">{t("composer.fb.overlay.doneTitle")}</p>
              {pagePermalink ? (
                <a
                  href={pagePermalink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-ocean underline underline-offset-2"
                >
                  {t("composer.fb.viewPost")}
                </a>
              ) : null}
              <p className="text-sm text-muted">
                {t("composer.fb.overlay.doneGroups", {
                  count: String(selectedGroups.length),
                })}
              </p>
            </div>
          ) : null}

          {error ? (
            <p className="mt-4 text-sm text-coral-deep" role="alert">
              {error}
            </p>
          ) : null}
        </div>

        <footer className="flex shrink-0 flex-wrap gap-2 border-t border-line/70 px-5 py-4 sm:px-6">
          {step === "compose" ? (
            <>
              <Button type="button" variant="secondary" size="md" onClick={onClose}>
                {t("composer.fb.overlay.close")}
              </Button>
              <Button
                type="button"
                variant="primary"
                size="md"
                disabled={pending}
                onClick={goConfirm}
              >
                {t("composer.fb.continue")}
              </Button>
            </>
          ) : null}
          {step === "confirm" ? (
            <>
              <Button
                type="button"
                variant="secondary"
                size="md"
                disabled={pending}
                onClick={() => setStep("compose")}
              >
                {t("composer.fb.back")}
              </Button>
              <Button
                type="button"
                variant="primary"
                size="md"
                disabled={pending}
                onClick={startPublish}
              >
                {pending ? t("composer.fb.posting") : t("composer.fb.postNow")}
              </Button>
            </>
          ) : null}
          {step === "blast" ? (
            <>
              <Button type="button" variant="primary" size="md" onClick={openCurrentGroup}>
                {t("composer.fb.overlay.openGroup")}
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={() => nextGroup(true)}
              >
                {t("composer.fb.overlay.markPosted")}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="md"
                onClick={() => nextGroup(false)}
              >
                {t("composer.fb.overlay.skipGroup")}
              </Button>
            </>
          ) : null}
          {step === "done" ? (
            <Button type="button" variant="primary" size="md" onClick={onClose}>
              {t("composer.fb.overlay.doneClose")}
            </Button>
          ) : null}
        </footer>
      </div>
    </div>,
    document.body,
  );
}
