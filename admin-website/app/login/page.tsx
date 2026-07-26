"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { requestMagicLink } from "./actions";

type HashAuth = {
  accessToken?: string;
  refreshToken?: string;
  error?: string;
};

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
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    let cancelled = false;

    async function completeFromUrl() {
      const code = searchParams.get("code");
      const queryError =
        searchParams.get("error_description") || searchParams.get("error");
      const authError = hashAuth?.error || queryError;

      if (authError) {
        if (cancelled) return;
        setCompletingMagicLink(false);
        setError(
          authError === "magic_link"
            ? "This sign-in link is invalid or expired. Request a new one, or sign in with your password."
            : authError,
        );
        if (window.location.hash) {
          window.history.replaceState(
            null,
            "",
            window.location.pathname + window.location.search,
          );
        }
        return;
      }

      const accessToken = hashAuth?.accessToken;
      const refreshToken = hashAuth?.refreshToken;
      if ((!accessToken || !refreshToken) && !code) return;

      setCompletingMagicLink(true);
      const supabase = createClient();

      if (code) {
        const { error: exchangeError } =
          await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) {
          if (!cancelled) {
            setCompletingMagicLink(false);
            setError(
              exchangeError.message ||
                "This sign-in link is invalid or expired.",
            );
          }
          return;
        }
        if (cancelled) return;
        window.history.replaceState(null, "", window.location.pathname);
        router.replace("/");
        router.refresh();
        return;
      }

      const { data: existing } = await supabase.auth.getSession();
      if (existing.session) {
        if (cancelled) return;
        window.history.replaceState(null, "", window.location.pathname);
        router.replace("/");
        router.refresh();
        return;
      }

      if (accessToken && refreshToken) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (sessionError) {
          if (!cancelled) {
            setCompletingMagicLink(false);
            setError(
              sessionError.message ||
                "This sign-in link is invalid or expired.",
            );
          }
          return;
        }
        if (cancelled) return;
        window.history.replaceState(null, "", window.location.pathname);
        router.replace("/");
        router.refresh();
      }
    }

    void completeFromUrl();
    return () => {
      cancelled = true;
    };
  }, [hashAuth, router, searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMagicSent(false);
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

    router.push("/");
    router.refresh();
  }

  async function handleMagicLink() {
    setError(null);
    setMagicSent(false);
    const trimmed = email.trim();
    if (!trimmed) {
      setError("Enter your email to get a login link.");
      return;
    }

    setMagicLoading(true);
    const result = await requestMagicLink({ email: trimmed });
    setMagicLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    setMagicSent(true);
  }

  if (completingMagicLink) {
    return (
      <div className="mt-8 rounded-soft border border-line/80 bg-white/80 p-7 text-center shadow-[0_18px_50px_rgba(42,42,40,0.06)] backdrop-blur-sm">
        <p className="text-sm font-medium text-charcoal">Signing you in…</p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-8 space-y-5 rounded-soft border border-line/80 bg-white/80 p-7 shadow-[0_18px_50px_rgba(42,42,40,0.06)] backdrop-blur-sm"
    >
      <div>
        <label htmlFor="email" className="field-label">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          className="field-input"
        />
      </div>
      <div>
        <label htmlFor="password" className="field-label">
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
          className="field-input"
        />
      </div>
      {error && (
        <p className="text-sm text-coral-deep" role="alert">
          {error}
        </p>
      )}
      {magicSent && !error ? (
        <p className="text-sm text-palm" role="status">
          Check your inbox for a login link. It may take a minute to arrive.
        </p>
      ) : null}
      <button
        type="submit"
        disabled={loading || magicLoading}
        className="btn-primary w-full py-3"
      >
        {loading ? "Signing in…" : "Sign in"}
      </button>
      <div className="relative py-1 text-center">
        <span className="relative z-10 bg-white/80 px-3 text-xs font-medium uppercase tracking-wide text-muted">
          or
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
        className="btn-secondary w-full py-3"
      >
        {magicLoading ? "Sending link…" : "Email me a login link"}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="studio-atmosphere relative flex min-h-screen items-center justify-center px-4 py-12">
      <div className="studio-grain pointer-events-none absolute inset-0 opacity-60" aria-hidden />
      <div className="relative w-full max-w-md animate-fade-up">
        <p className="font-display text-sm font-semibold tracking-wide text-ocean">
          Admin
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold text-charcoal sm:text-4xl">
          Da Nang Expat Rentals
        </h1>
        <p className="mt-3 text-base leading-relaxed text-muted">
          Sign in to manage listings, areas, and content.
        </p>

        <Suspense
          fallback={
            <div className="mt-8 h-48 animate-pulse rounded-soft bg-white/50" />
          }
        >
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
