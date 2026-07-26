"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { updateArea, listAreaBucketImages, deleteAreaBucketImage } from "../actions";

type Area = {
  id: string;
  name: string;
  images: string[];
  vibe: string;
  price_range: string;
  who: string;
};

type SaveState = { error: string | null; saved: boolean };

function parseImagesRaw(raw: string): string[] {
  return raw
    .split(/[\n,;]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function AreaEditForm({ area }: { area: Area }) {
  const [images, setImages] = useState<string[]>(Array.isArray(area.images) ? area.images : []);
  const [showAdvancedUrls, setShowAdvancedUrls] = useState(false);
  const [bucketFiles, setBucketFiles] = useState<{ url: string; name: string }[]>([]);
  const [bucketError, setBucketError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deletingName, setDeletingName] = useState<string | null>(null);
  const [pendingDeleteName, setPendingDeleteName] = useState<string | null>(null);

  useEffect(() => {
    listAreaBucketImages().then((r) => {
      if (r.error) setBucketError(r.error);
      else if (r.files) setBucketFiles(r.files);
    });
  }, []);

  const [state, formAction, isPending] = useActionState(
    async (_: SaveState, formData: FormData): Promise<SaveState> => {
      const imagesRaw = (formData.get("images") as string) ?? "";
      const imagesList = parseImagesRaw(imagesRaw);
      const result = await updateArea(area.id, {
        name: (formData.get("name") as string) ?? "",
        images: imagesList,
        vibe: (formData.get("vibe") as string) ?? "",
        price_range: (formData.get("price_range") as string) ?? "",
        who: (formData.get("who") as string) ?? "",
      });
      if (result.error) return { error: result.error, saved: false };
      return { error: null, saved: true };
    },
    { error: null, saved: false }
  );

  const addImage = (url: string) => {
    if (url && !images.includes(url)) setImages((prev) => [...prev, url]);
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const moveImage = (index: number, direction: "up" | "down") => {
    const next = index + (direction === "up" ? -1 : 1);
    if (next < 0 || next >= images.length) return;
    setImages((prev) => {
      const out = [...prev];
      [out[index], out[next]] = [out[next], out[index]];
      return out;
    });
  };

  async function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    setUploadError(null);
    setUploading(true);
    try {
      const res = await fetch("/areas/upload", { method: "POST", body: formData });
      const data = (await res.json()) as { error?: string; url?: string };
      if (!res.ok) {
        setUploadError(data.error ?? "Upload failed.");
        return;
      }
      if (data.url) {
        addImage(data.url);
        const r = await listAreaBucketImages();
        if (r.files) setBucketFiles(r.files);
      }
      form.reset();
    } finally {
      setUploading(false);
    }
  }

  async function handleDeleteFromBucket(name: string) {
    setPendingDeleteName(null);
    setDeletingName(name);
    setBucketError(null);
    const result = await deleteAreaBucketImage(name);
    setDeletingName(null);
    if (result.error) setBucketError(result.error);
    else {
      setBucketFiles((prev) => prev.filter((f) => f.name !== name));
      setImages((prev) =>
        prev.filter((url) => !url.includes(`/${name}`) && !url.endsWith(name))
      );
    }
  }

  return (
    <div className="mt-8">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:items-start">
        {/* Left — details (save form) */}
        <form id="area-save-form" action={formAction} className="surface space-y-5 p-5 sm:p-6">
          <input type="hidden" name="images" value={images.join("\n")} />

          <div>
            <h2 className="font-display text-sm font-semibold text-charcoal">Area details</h2>
            <p className="mt-1 text-xs text-muted">
              Copy shown on the public neighbourhood guide for this area.
            </p>
          </div>

          <div>
            <label htmlFor="name" className="field-label">
              Name
            </label>
            <input
              id="name"
              name="name"
              defaultValue={area.name}
              required
              className="field-input"
            />
          </div>

          <div>
            <label htmlFor="vibe" className="field-label">
              Vibe
            </label>
            <p className="mb-1.5 text-xs text-muted">Short feel of the neighbourhood.</p>
            <textarea
              id="vibe"
              name="vibe"
              rows={3}
              defaultValue={area.vibe}
              required
              placeholder="e.g. Beach-adjacent, cafés, and evening buzz"
              className="field-input"
            />
          </div>

          <div>
            <label htmlFor="price_range" className="field-label">
              Price range
            </label>
            <p className="mb-1.5 text-xs text-muted">Typical rents renters see on the site.</p>
            <input
              id="price_range"
              name="price_range"
              defaultValue={area.price_range ?? ""}
              placeholder="$400–700 / month"
              className="field-input"
            />
          </div>

          <div>
            <label htmlFor="who" className="field-label">
              Who it&apos;s for
            </label>
            <p className="mb-1.5 text-xs text-muted">Who tends to like living here.</p>
            <textarea
              id="who"
              name="who"
              rows={2}
              defaultValue={area.who}
              required
              placeholder="e.g. Remote workers, couples, short stays"
              className="field-input"
            />
          </div>
        </form>

        {/* Right — images (outside save form; no nested forms) */}
        <div className="space-y-6">
          <section className="surface space-y-4 p-5 sm:p-6">
            <div>
              <h2 className="font-display text-sm font-semibold text-charcoal">Hero images</h2>
              <p className="mt-1 text-xs text-muted">
                Order is display order. First image is the main hero.
              </p>
            </div>

            {images.length === 0 ? (
              <p className="rounded-quieter border border-dashed border-line bg-sand/30 px-4 py-8 text-center text-sm text-muted">
                No images yet — upload or add from the library below.
              </p>
            ) : (
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {images.map((url, i) => (
                  <li
                    key={`${url}-${i}`}
                    className="flex flex-col overflow-hidden rounded-quieter border border-line/80 bg-white"
                  >
                    <div className="relative aspect-video bg-sand">
                      <img src={url} alt="" className="h-full w-full object-cover" />
                      <span className="absolute left-1.5 top-1.5 rounded-quieter bg-charcoal/75 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                        {i === 0 ? "Main" : i + 1}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-1 p-1.5">
                      <div className="flex gap-0.5">
                        <button
                          type="button"
                          onClick={() => moveImage(i, "up")}
                          disabled={i === 0}
                          className="rounded-quieter p-1 text-muted transition hover:bg-sand hover:text-charcoal disabled:opacity-40 disabled:hover:bg-transparent"
                          aria-label="Move earlier"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          onClick={() => moveImage(i, "down")}
                          disabled={i === images.length - 1}
                          className="rounded-quieter p-1 text-muted transition hover:bg-sand hover:text-charcoal disabled:opacity-40 disabled:hover:bg-transparent"
                          aria-label="Move later"
                        >
                          ↓
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        className="rounded-quieter px-1.5 py-1 text-[11px] font-medium text-muted transition hover:bg-coral-soft hover:text-coral-deep"
                      >
                        Remove
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <div>
              <button
                type="button"
                onClick={() => setShowAdvancedUrls((v) => !v)}
                className="text-xs font-medium text-ocean transition hover:text-ocean-deep"
              >
                {showAdvancedUrls ? "Hide URL editor" : "Advanced: edit URLs"}
              </button>
              {showAdvancedUrls && (
                <textarea
                  rows={3}
                  value={images.join("\n")}
                  onChange={(e) => setImages(parseImagesRaw(e.target.value))}
                  placeholder="One image URL per line"
                  className="field-input mt-2 font-mono text-xs"
                />
              )}
            </div>
          </section>

          <section className="surface space-y-4 bg-sand/30 p-5 sm:p-6">
            <div>
              <h2 className="font-display text-sm font-semibold text-charcoal">Image library</h2>
              <p className="mt-1 text-xs text-muted">
                Upload new files or reuse images in the{" "}
                <code className="rounded-quieter bg-sand-deep/60 px-1 py-0.5 text-charcoal">
                  areas
                </code>{" "}
                bucket. Deleting a file removes it from storage for every area.
              </p>
            </div>

            <div className="rounded-quieter border border-line/70 bg-white/80 p-3">
              <p className="text-xs font-medium text-charcoal">Upload</p>
              <form
                onSubmit={handleUpload}
                className="mt-2 flex flex-wrap items-center gap-3"
              >
                <input
                  name="file"
                  type="file"
                  accept="image/*"
                  className="max-w-full text-sm text-charcoal"
                  required
                  disabled={uploading}
                />
                <button type="submit" disabled={uploading} className="btn-primary px-3 py-2">
                  {uploading ? "Uploading…" : "Upload & add"}
                </button>
              </form>
              {uploadError && <p className="mt-2 text-sm text-coral-deep">{uploadError}</p>}
            </div>

            <div>
              <p className="text-xs font-medium text-charcoal">From bucket</p>
              {bucketError && <p className="mt-2 text-sm text-coral-deep">{bucketError}</p>}
              {bucketFiles.length > 0 ? (
                <ul className="mt-2.5 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {bucketFiles.map((f) => {
                    const onArea = images.includes(f.url);
                    return (
                      <li
                        key={f.url}
                        className={`flex flex-col overflow-hidden rounded-quieter border bg-white ${
                          onArea ? "border-ocean/40 opacity-80" : "border-line/80"
                        }`}
                      >
                        <div className="relative">
                          <img src={f.url} alt="" className="h-20 w-full object-cover" />
                          {onArea && (
                            <span className="absolute left-1 top-1 rounded-quieter bg-ocean px-1.5 py-0.5 text-[10px] font-semibold text-white">
                              On area
                            </span>
                          )}
                        </div>
                        <div className="flex flex-col gap-1.5 p-1.5">
                          <span className="truncate text-xs text-charcoal" title={f.name}>
                            {f.name}
                          </span>
                          {pendingDeleteName === f.name ? (
                            <div className="flex flex-wrap items-center gap-1">
                              <span className="text-[10px] text-muted">Delete forever?</span>
                              <button
                                type="button"
                                onClick={() => handleDeleteFromBucket(f.name)}
                                disabled={deletingName === f.name}
                                className="btn-danger"
                              >
                                {deletingName === f.name ? "…" : "Yes"}
                              </button>
                              <button
                                type="button"
                                onClick={() => setPendingDeleteName(null)}
                                className="rounded-quieter bg-sand px-2 py-0.5 text-xs font-medium text-charcoal transition hover:bg-sand-deep"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              <button
                                type="button"
                                onClick={() => addImage(f.url)}
                                disabled={onArea}
                                className="rounded-quieter bg-ocean px-2 py-0.5 text-xs font-medium text-white transition hover:bg-ocean-deep disabled:cursor-default disabled:opacity-50"
                              >
                                {onArea ? "Added" : "Add"}
                              </button>
                              <button
                                type="button"
                                onClick={() => setPendingDeleteName(f.name)}
                                disabled={deletingName !== null}
                                className="rounded-quieter bg-coral-soft px-2 py-0.5 text-xs font-medium text-coral-deep transition hover:bg-coral/20 disabled:opacity-50"
                                title="Delete from storage (all areas)"
                              >
                                Delete file
                              </button>
                            </div>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                !bucketError && (
                  <p className="mt-2 text-sm text-muted">No files in bucket yet. Upload one above.</p>
                )
              )}
            </div>
          </section>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-line/80 pt-6">
        <button
          type="submit"
          form="area-save-form"
          disabled={isPending}
          className="btn-primary disabled:opacity-60"
        >
          {isPending ? "Saving…" : "Save changes"}
        </button>
        <Link href="/areas" className="btn-secondary">
          Cancel
        </Link>
        {state?.error && (
          <p className="text-sm text-coral-deep" role="alert">
            {state.error}
          </p>
        )}
        {state?.saved && !state.error && !isPending && (
          <p className="text-sm font-medium text-palm" role="status">
            Saved
          </p>
        )}
      </div>
    </div>
  );
}
