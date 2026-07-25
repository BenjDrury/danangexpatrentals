"use client";

import Link from "next/link";
import { useActionState } from "react";
import { updateApartmentType } from "../actions";

type ApartmentType = {
  id: string;
  title: string;
  desc: string;
  sort_order: number;
};

export function ApartmentTypeEditForm({ type_ }: { type_: ApartmentType }) {
  const [state, formAction] = useActionState(
    async (_: unknown, formData: FormData) => {
      const result = await updateApartmentType(type_.id, {
        title: (formData.get("title") as string) ?? "",
        desc: (formData.get("desc") as string) ?? "",
        sort_order: (formData.get("sort_order") as string) ?? "0",
      });
      return result.error ? { error: result.error } : { error: null };
    },
    { error: null }
  );

  return (
    <form action={formAction} className="mt-6 max-w-xl space-y-5">
      <div>
        <label htmlFor="title" className="field-label">
          Title
        </label>
        <input
          id="title"
          name="title"
          defaultValue={type_.title}
          required
          className="field-input"
        />
      </div>
      <div>
        <label htmlFor="desc" className="field-label">
          Description
        </label>
        <textarea
          id="desc"
          name="desc"
          rows={3}
          defaultValue={type_.desc}
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
          className="field-input max-w-[8rem]"
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
        <Link href="/apartment-types" className="btn-secondary">
          Cancel
        </Link>
      </div>
    </form>
  );
}
