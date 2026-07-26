"use client";

import { useCallback, useEffect, useRef, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { LangToggle } from "@/components/LangToggle";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { capture } from "@/lib/analytics";
import { syncPostHogIdentity } from "@/lib/analytics-identity";
import { requestMagicLink } from "./actions";
import { getPublicSiteUrl } from "@/lib/public-url";
import {
  AUTH_RATE_LIMITED,
  isAuthRateLimitError,
} from "@/lib/auth-errors";

function mapLoginError(
  message: string | null | undefined,
  t: (key: string) => string,
): string {
  if (!message) return t("login.magicLinkFailed");
  if (message === AUTH_RATE_LIMITED || isAuthRateLimitError(message)) {
    return t("login.rateLimited");
  }
  return message;
}

function safeNext(next: string | null): string {
  if (!next) return "/";
  const trimmed = next.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) return "/";
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) return "/";
  return trimmed;
}

type HashAuth = {
  accessToken?: string;
  refreshToken?: string;
  error?: string;
};

/** Capture hash tokens before parent effects (e.g. AppProviders) can clear them. */
function readHashAuth(): HashAuth | null {
  if (typeof window === "undefined") return null;
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const accessToken = hashParams.get("access_token") ?? undefined;
  const refreshToken = hashParams.get("refresh_token") ?? undefined;
  const error =
    hashParams.get("error_description") || hashParams.get("error") || undefined;
  if (error) return { error };
  if (accessToken && refreshToken) return { accessToken, refreshToken };
  return null;
}

function hasAuthCodeInSearch(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(new URLSearchParams(window.location.search).get("code"));
}

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [magicLoading, setMagicLoading] = useState(false);
  const [magicSent, setMagicSent] = useState(false);
  const [hashAuth] = useState<HashAuth | null>(readHashAuth);
  const [completingMagicLink, setCompletingMagicLink] = useState(
    () =>
      Boolean(hashAuth?.accessToken && hashAuth?.refreshToken) ||
      hasAuthCodeInSearch(),
  );
  const completingRef = useRef(completingMagicLink);
  completingRef.current = completingMagicLink;
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLocale();
  const nextPath = safeNext(searchParams.get("next"));

  const clearAuthParamsFromUrl = useCallback(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    url.hash = "";
    url.searchParams.delete("code");
    url.searchParams.delete("error");
    url.searchParams.delete("error_description");
    url.searchParams.delete("error_code");
    if (nextPath && nextPath !== "/") {
      url.searchParams.set("next", nextPath);
    }
    window.history.replaceState(null, "", url.pathname + url.search);
  }, [nextPath]);

  const abortMagicLinkCompletion = useCallback(
    (message?: string) => {
      setCompletingMagicLink(false);
      setError(mapLoginError(message ?? t("login.magicLinkFailed"), t));
      clearAuthParamsFromUrl();
    },
    [clearAuthParamsFromUrl, t],
  );

  // Supabase magic links redirect with tokens in the URL hash (implicit) or
  // ?code= (PKCE). Hash fragments never reach the server, so complete the
  // session here and then navigate into the studio.
  useEffect(() => {
    let cancelled = false;

    async function finishSignIn(user: User) {
      await syncPostHogIdentity(user);
      capture("user_signed_in", { method: "magic_link" });
      router.replace(nextPath);
      router.refresh();
    }

    async function completeFromUrl() {
      const code = searchParams.get("code");
      const queryError =
        searchParams.get("error_description") || searchParams.get("error");
      const authError = hashAuth?.error || queryError;

      if (authError) {
        if (cancelled) return;
        abortMagicLinkCompletion(authError);
        return;
      }

      const accessToken = hashAuth?.accessToken;
      const refreshToken = hashAuth?.refreshToken;
      if ((!accessToken || !refreshToken) && !code) return;

      setCompletingMagicLink(true);
      const supabase = createClient();

      if (code) {
        const { data, error: exchangeError } =
          await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError || !data.session) {
          if (!cancelled) {
            abortMagicLinkCompletion(
              exchangeError?.message ?? t("login.magicLinkFailed"),
            );
          }
          return;
        }
        if (cancelled) return;
        clearAuthParamsFromUrl();
        await finishSignIn(data.session.user);
        return;
      }

      // Prefer an already-detected session (createBrowserClient may have
      // parsed the hash via detectSessionInUrl in AppProviders).
      const { data: existing } = await supabase.auth.getSession();
      if (existing.session?.user) {
        if (cancelled) return;
        clearAuthParamsFromUrl();
        await finishSignIn(existing.session.user);
        return;
      }

      if (accessToken && refreshToken) {
        const { data, error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (sessionError || !data.session) {
          if (!cancelled) {
            abortMagicLinkCompletion(
              sessionError?.message ?? t("login.magicLinkFailed"),
            );
          }
          return;
        }
        if (cancelled) return;
        clearAuthParamsFromUrl();
        await finishSignIn(data.session.user);
      }
    }

    void completeFromUrl();

    // Never leave the user stuck on "Signing you in…" with no form.
    const timeoutId = window.setTimeout(() => {
      if (cancelled || !completingRef.current) return;
      setCompletingMagicLink(false);
      setError(t("login.magicLinkTimedOut"));
      clearAuthParamsFromUrl();
    }, 12_000);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [
    abortMagicLinkCompletion,
    clearAuthParamsFromUrl,
    hashAuth,
    nextPath,
    router,
    searchParams,
    t,
  ]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMagicSent(false);
    setLoading(true);

    const supabase = createClient();
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);
    if (signInError) {
      setError(mapLoginError(signInError.message, t));
      return;
    }

    if (signInData.user) {
      // Identify immediately (id + display name) before navigation.
      await syncPostHogIdentity(signInData.user);
      capture("user_signed_in", { method: "password" });
    }

    router.push(nextPath);
    router.refresh();
  }

  async function handleMagicLink() {
    setError(null);
    setMagicSent(false);
    const trimmed = email.trim();
    if (!trimmed) {
      setError(t("login.magicLinkNeedEmail"));
      return;
    }

    setMagicLoading(true);
    const result = await requestMagicLink({ email: trimmed, next: nextPath });
    setMagicLoading(false);

    if (result.error) {
      setError(mapLoginError(result.error, t));
      return;
    }

    setMagicSent(true);
    capture("magic_link_requested");
  }

  if (completingMagicLink) {
    return (
      <div className="mt-8 rounded-soft border border-line/80 bg-white p-7 text-center shadow-[0_18px_50px_rgba(42,42,40,0.06)]">
        <p className="text-sm font-medium text-charcoal">
          {t("login.magicLinkCompleting")}
        </p>
        <button
          type="button"
          onClick={() => abortMagicLinkCompletion(t("login.magicLinkFailed"))}
          className="mt-5 text-sm font-semibold text-ocean transition hover:text-ocean-deep"
        >
          {t("login.showSignInForm")}
        </button>
      </div>
    );
  }

  const inputClass =
    "mt-1.5 block w-full rounded-quieter border border-line bg-white px-3.5 py-2.5 text-charcoal shadow-sm outline-none transition placeholder:text-muted/70 focus:border-ocean focus:ring-2 focus:ring-ocean/20";

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-8 space-y-5 rounded-soft border border-line/80 bg-white p-7 shadow-[0_18px_50px_rgba(42,42,40,0.06)]"
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
          className={inputClass}
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
          className={inputClass}
        />
      </div>
      {error && (
        <p className="text-sm text-red-700" role="alert">
          {error}
        </p>
      )}
      {magicSent && !error ? (
        <p className="text-sm text-palm" role="status">
          {t("login.magicLinkSent")}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={loading || magicLoading}
        className="w-full rounded-quieter bg-ocean px-4 py-3 text-sm font-semibold text-white transition hover:bg-ocean-deep focus:outline-none focus:ring-2 focus:ring-ocean/40 focus:ring-offset-2 focus:ring-offset-foam disabled:opacity-50"
      >
        {loading ? t("login.submitting") : t("login.submit")}
      </button>
      <div className="relative py-1 text-center">
        <span className="relative z-10 bg-white px-3 text-xs font-medium uppercase tracking-wide text-muted">
          {t("login.or")}
        </span>
        <span
          className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-line/80"
          aria-hidden
        />
      </div>
      <button
        type="button"
        disabled={loading || magicLoading}
        onClick={() => void handleMagicLink()}
        className="w-full rounded-quieter border border-line bg-foam px-4 py-3 text-sm font-semibold text-charcoal transition hover:border-ocean/40 hover:bg-sand focus:outline-none focus:ring-2 focus:ring-ocean/30 focus:ring-offset-2 focus:ring-offset-foam disabled:opacity-50"
      >
        {magicLoading ? t("login.magicLinkSending") : t("login.magicLinkSubmit")}
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
        <p className="mt-3 text-center text-sm text-muted">
          {t("login.applyPrompt")}{" "}
          <a
            href={`${getPublicSiteUrl()}/partners/apply`}
            className="font-medium text-ocean transition hover:text-ocean-deep"
            onClick={() =>
              capture("partner_apply_cta_clicked", { source: "login_page" })
            }
          >
            {t("login.applyLink")}
          </a>
        </p>
      </div>
    </div>
  );
}
