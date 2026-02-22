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
    <form action={formAction} className="mt-6 max-w-xl space-y-4">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-slate-700">
          Title
        </label>
        <input
          id="title"
          name="title"
          defaultValue={type_.title}
          required
          className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
        />
      </div>
      <div>
        <label htmlFor="desc" className="block text-sm font-medium text-slate-700">
          Description
        </label>
        <textarea
          id="desc"
          name="desc"
          rows={3}
          defaultValue={type_.desc}
          required
          className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
        />
      </div>
      <div>
        <label htmlFor="sort_order" className="block text-sm font-medium text-slate-700">
          Sort order
        </label>
        <input
          id="sort_order"
          name="sort_order"
          type="number"
          min={0}
          defaultValue={type_.sort_order}
          required
          className="mt-1 block w-full max-w-[8rem] rounded-lg border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
        />
      </div>
      {state?.error && (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}
      <div className="flex gap-3">
        <button
          type="submit"
          className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700"
        >
          Save
        </button>
        <Link
          href="/apartment-types"
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
