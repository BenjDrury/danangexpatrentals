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

function parseImagesRaw(raw: string): string[] {
  return raw
    .split(/[\n,;]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function AreaEditForm({ area }: { area: Area }) {
  const [images, setImages] = useState<string[]>(Array.isArray(area.images) ? area.images : []);
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

  const [state, formAction] = useActionState(
    async (_: unknown, formData: FormData) => {
      const imagesRaw = (formData.get("images") as string) ?? "";
      const imagesList = parseImagesRaw(imagesRaw);
      const result = await updateArea(area.id, {
        name: (formData.get("name") as string) ?? "",
        images: imagesList,
        vibe: (formData.get("vibe") as string) ?? "",
        price_range: (formData.get("price_range") as string) ?? "",
        who: (formData.get("who") as string) ?? "",
      });
      return result.error ? { error: result.error } : { error: null };
    },
    { error: null }
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
    else setBucketFiles((prev) => prev.filter((f) => f.name !== name));
  }

  return (
    <div className="mt-6 max-w-xl space-y-6">
      <form onSubmit={handleUpload} className="surface bg-sand/40 p-4">
        <h3 className="font-display text-sm font-semibold text-charcoal">Upload to bucket</h3>
        <p className="mt-1 text-xs text-muted">
          Upload a file to the{" "}
          <code className="rounded-quieter bg-sand-deep/60 px-1.5 py-0.5 text-charcoal">areas</code>{" "}
          bucket; the new URL will be added to this area’s images below.
        </p>
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-xs text-muted">File</span>
            <input name="file" type="file" accept="image/*" className="text-sm text-charcoal" required disabled={uploading} />
          </label>
          <button type="submit" disabled={uploading} className="btn-primary px-3 py-2">
            {uploading ? "Uploading…" : "Upload"}
          </button>
        </div>
        {uploadError && <p className="mt-2 text-sm text-coral-deep">{uploadError}</p>}
      </form>

      <form action={formAction} className="space-y-6">
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
          <label className="field-label">
            Area images (order = hero order; first = main)
          </label>
          <p className="mt-1 text-xs text-muted">
            Reorder with ↑/↓; add from bucket below or paste URLs in the box.
          </p>
          <textarea
            id="images"
            name="images"
            rows={2}
            value={images.join("\n")}
            onChange={(e) => setImages(parseImagesRaw(e.target.value))}
            placeholder="Or paste URLs, one per line"
            className="field-input mt-2 text-sm"
          />
          {images.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-3">
              {images.map((url, i) => (
                <li
                  key={`${url}-${i}`}
                  className="flex flex-col overflow-hidden rounded-quieter border border-line/80 bg-white"
                >
                  <div className="relative aspect-video w-32 bg-sand sm:w-40">
                    <img
                      src={url}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                    <span className="absolute left-1.5 top-1.5 rounded-quieter bg-charcoal/70 px-1.5 py-0.5 text-xs font-medium text-white">
                      {i + 1}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-1 p-1.5">
                    <div className="flex gap-0.5">
                      <button
                        type="button"
                        onClick={() => moveImage(i, "up")}
                        disabled={i === 0}
                        className="rounded-quieter p-1 text-muted transition hover:bg-sand hover:text-charcoal disabled:opacity-40 disabled:hover:bg-transparent"
                        aria-label="Move up"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => moveImage(i, "down")}
                        disabled={i === images.length - 1}
                        className="rounded-quieter p-1 text-muted transition hover:bg-sand hover:text-charcoal disabled:opacity-40 disabled:hover:bg-transparent"
                        aria-label="Move down"
                      >
                        ↓
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="rounded-quieter p-1 text-muted transition hover:bg-coral-soft hover:text-coral-deep"
                      aria-label="Remove"
                    >
                      ×
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="surface bg-sand/40 p-4">
          <h3 className="font-display text-sm font-semibold text-charcoal">Add from bucket</h3>
          <p className="mt-1 text-xs text-muted">
            Select an image from the bucket to add its URL to this area’s images.
          </p>
          {bucketError && <p className="mt-2 text-sm text-coral-deep">{bucketError}</p>}
          {bucketFiles.length > 0 && (
            <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {bucketFiles.map((f) => (
                <li
                  key={f.url}
                  className="flex flex-col overflow-hidden rounded-quieter border border-line/80 bg-white"
                >
                  <img src={f.url} alt="" className="h-20 w-full object-cover" />
                  <div className="flex items-center justify-between gap-1 p-1.5">
                    <span className="truncate text-xs text-charcoal" title={f.name}>
                      {f.name}
                    </span>
                    <div className="flex shrink-0 items-center gap-1">
                      {pendingDeleteName === f.name ? (
                        <>
                          <span className="text-xs text-muted">Sure?</span>
                          <button
                            type="button"
                            onClick={() => handleDeleteFromBucket(f.name)}
                            disabled={deletingName === f.name}
                            className="btn-danger"
                          >
                            {deletingName === f.name ? "…" : "Yes, delete"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setPendingDeleteName(null)}
                            className="rounded-quieter bg-sand px-2 py-0.5 text-xs font-medium text-charcoal transition hover:bg-sand-deep"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => addImage(f.url)}
                            className="rounded-quieter bg-ocean px-2 py-0.5 text-xs font-medium text-white transition hover:bg-ocean-deep"
                          >
                            Add
                          </button>
                          <button
                            type="button"
                            onClick={() => setPendingDeleteName(f.name)}
                            disabled={deletingName !== null}
                            className="rounded-quieter bg-coral-soft px-2 py-0.5 text-xs font-medium text-coral-deep transition hover:bg-coral/20 disabled:opacity-50"
                            title="Delete from bucket"
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {!bucketError && bucketFiles.length === 0 && (
            <p className="mt-2 text-sm text-muted">No files in bucket yet. Upload one above.</p>
          )}
        </div>
        <div>
          <label htmlFor="vibe" className="field-label">
            Vibe
          </label>
          <textarea
            id="vibe"
            name="vibe"
            rows={3}
            defaultValue={area.vibe}
            required
            className="field-input"
          />
        </div>
        <div>
          <label htmlFor="price_range" className="field-label">
            Price range
          </label>
          <input
            id="price_range"
            name="price_range"
            defaultValue={area.price_range ?? ""}
            className="field-input"
          />
        </div>
        <div>
          <label htmlFor="who" className="field-label">
            Who it&apos;s for
          </label>
          <textarea
            id="who"
            name="who"
            rows={2}
            defaultValue={area.who}
            required
            className="field-input"
          />
        </div>
        {state?.error && (
          <p className="text-sm text-coral-deep" role="alert">
            {state.error}
          </p>
        )}
        <div className="flex gap-3">
          <button type="submit" className="btn-primary">
            Save
          </button>
          <Link href="/areas" className="btn-secondary">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
