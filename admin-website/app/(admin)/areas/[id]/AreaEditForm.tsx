"use client";

import Link from "next/link";
import { useActionState } from "react";
import { updateArea } from "../actions";

type Area = {
  id: string;
  name: string;
  image: string;
  vibe: string;
  price_range: string;
  who: string;
};

export function AreaEditForm({ area }: { area: Area }) {
  const [state, formAction] = useActionState(
    async (_: unknown, formData: FormData) => {
      const result = await updateArea(area.id, {
        name: (formData.get("name") as string) ?? "",
        image: (formData.get("image") as string) ?? "",
        vibe: (formData.get("vibe") as string) ?? "",
        price_range: (formData.get("price_range") as string) ?? "",
        who: (formData.get("who") as string) ?? "",
      });
      return result.error ? { error: result.error } : { error: null };
    },
    { error: null }
  );

  return (
    <form action={formAction} className="mt-6 max-w-xl space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-slate-700">
          Name
        </label>
        <input
          id="name"
          name="name"
          defaultValue={area.name}
          required
          className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
        />
      </div>
      <div>
        <label htmlFor="image" className="block text-sm font-medium text-slate-700">
          Image URL
        </label>
        <input
          id="image"
          name="image"
          type="url"
          defaultValue={area.image}
          required
          className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
        />
      </div>
      <div>
        <label htmlFor="vibe" className="block text-sm font-medium text-slate-700">
          Vibe
        </label>
        <textarea
          id="vibe"
          name="vibe"
          rows={3}
          defaultValue={area.vibe}
          required
          className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
        />
      </div>
      <div>
        <label htmlFor="price_range" className="block text-sm font-medium text-slate-700">
          Price range
        </label>
        <input
          id="price_range"
          name="price_range"
          defaultValue={area.price_range}
          required
          className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
        />
      </div>
      <div>
        <label htmlFor="who" className="block text-sm font-medium text-slate-700">
          Who it&apos;s for
        </label>
        <textarea
          id="who"
          name="who"
          rows={2}
          defaultValue={area.who}
          required
          className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
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
          href="/areas"
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
