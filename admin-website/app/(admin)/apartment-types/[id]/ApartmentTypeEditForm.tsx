"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { updateApartmentType } from "../actions";

type ApartmentType = {
  id: string;
  title: string;
  desc: string;
  sort_order: number;
};

type SaveState = { error: string | null; saved: boolean };

export function ApartmentTypeEditForm({ type_ }: { type_: ApartmentType }) {
  const [title, setTitle] = useState(type_.title);
  const [desc, setDesc] = useState(type_.desc);

  const [state, formAction, isPending] = useActionState(
    async (_: SaveState, formData: FormData): Promise<SaveState> => {
      const result = await updateApartmentType(type_.id, {
        title: (formData.get("title") as string) ?? "",
        desc: (formData.get("desc") as string) ?? "",
        sort_order: (formData.get("sort_order") as string) ?? "0",
      });
      if (result.error) return { error: result.error, saved: false };
      return { error: null, saved: true };
    },
    { error: null, saved: false }
  );

  return (
    <form action={formAction} className="mt-8 max-w-2xl space-y-6">
      <div className="surface space-y-5 p-5 sm:p-6">
        <div className="grid gap-5 sm:grid-cols-[1fr_8rem] sm:items-start">
          <div>
            <label htmlFor="title" className="field-label">
              Title
            </label>
            <input
              id="title"
              name="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="field-input"
            />
          </div>
          <div>
            <label htmlFor="sort_order" className="field-label">
              Sort order
            </label>
            <input
              id="sort_order"
              name="sort_order"
              type="number"
              min={0}
              defaultValue={type_.sort_order}
              required
              className="field-input"
            />
            <p className="mt-1.5 text-xs text-muted">Lower numbers appear first.</p>
          </div>
        </div>

        <div>
          <label htmlFor="desc" className="field-label">
            Description
          </label>
          <textarea
            id="desc"
            name="desc"
            rows={3}
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            required
            className="field-input"
          />
        </div>
      </div>

      <div className="surface bg-sand/30 p-5 sm:p-6">
        <p className="font-display text-xs font-semibold uppercase tracking-wide text-muted">
          Preview
        </p>
        <div className="mt-3 rounded-quieter border border-line/80 bg-white px-4 py-4">
          <h3 className="font-display text-lg font-semibold text-charcoal">
            {title.trim() || "Title"}
          </h3>
          <p className="mt-1.5 text-sm leading-relaxed text-muted">
            {desc.trim() || "Description appears here."}
          </p>
        </div>
      </div>

      {(state?.error || (state?.saved && !isPending)) && (
        <div>
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
      )}

      <div className="flex gap-3">
        <button type="submit" disabled={isPending} className="btn-primary disabled:opacity-60">
          {isPending ? "Saving…" : "Save changes"}
        </button>
        <Link href="/apartment-types" className="btn-secondary">
          Cancel
        </Link>
      </div>
    </form>
  );
}
