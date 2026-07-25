"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LangToggle } from "@/components/LangToggle";
import { useLocale } from "@/lib/i18n/LocaleProvider";

function safeNext(next: string | null): string {
  if (!next) return "/";
  const trimmed = next.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) return "/";
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) return "/";
  return trimmed;
}

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLocale();
  const nextPath = safeNext(searchParams.get("next"));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);
    if (signInError) {
      setError(signInError.message);
      return;
    }

    router.push(nextPath);
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-8 space-y-5 rounded-soft border border-line/80 bg-white/80 p-7 shadow-[0_18px_50px_rgba(42,42,40,0.06)] backdrop-blur-sm"
    >
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-charcoal">
          {t("login.email")}
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          className="mt-1.5 block w-full rounded-quieter border border-line bg-foam/60 px-3.5 py-2.5 text-charcoal outline-none transition focus:border-ocean focus:ring-2 focus:ring-ocean/20"
        />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-charcoal">
          {t("login.password")}
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
          className="mt-1.5 block w-full rounded-quieter border border-line bg-foam/60 px-3.5 py-2.5 text-charcoal outline-none transition focus:border-ocean focus:ring-2 focus:ring-ocean/20"
        />
      </div>
      {error && (
        <p className="text-sm text-red-700" role="alert">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-quieter bg-ocean px-4 py-3 text-sm font-semibold text-white transition hover:bg-ocean-deep focus:outline-none focus:ring-2 focus:ring-ocean/40 focus:ring-offset-2 focus:ring-offset-foam disabled:opacity-50"
      >
        {loading ? t("login.submitting") : t("login.submit")}
      </button>
    </form>
  );
}

export default function LoginPage() {
  const { t } = useLocale();

  return (
    <div className="studio-atmosphere relative flex min-h-screen items-center justify-center px-4 py-12">
      <div className="studio-grain pointer-events-none absolute inset-0 opacity-60" aria-hidden />
      <div className="absolute right-4 top-4 sm:right-6 sm:top-6">
        <LangToggle />
      </div>
      <div className="relative w-full max-w-md animate-fade-up">
        <p className="font-display text-sm font-semibold tracking-wide text-ocean">
          {t("brand.studio")}
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold text-charcoal sm:text-4xl">
          {t("brand.name")}
        </h1>
        <p className="mt-3 text-base leading-relaxed text-muted">{t("login.tagline")}</p>

        <Suspense fallback={<div className="mt-8 h-48 animate-pulse rounded-soft bg-white/50" />}>
          <LoginForm />
        </Suspense>

        <p className="mt-6 text-center text-sm text-muted">{t("login.inviteNote")}</p>
      </div>
    </div>
  );
}
