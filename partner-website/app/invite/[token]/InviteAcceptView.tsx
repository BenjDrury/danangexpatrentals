"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { LangToggle } from "@/components/LangToggle";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import type { PartnerInviteStatus } from "types";
import { acceptInviteAction, createAccountFromInviteAction } from "./actions";
import { capture, identifyUser } from "@/lib/analytics";

export function InviteAcceptView({
  token,
  invite,
  userEmail,
  isSignedIn,
}: {
  token: string;
  invite: {
    email: string;
    status: PartnerInviteStatus;
    companyName: string | null;
  } | null;
  userEmail: string | null;
  isSignedIn: boolean;
}) {
  const { t } = useLocale();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [mode, setMode] = useState<"signin" | "signup">(
    isSignedIn ? "signin" : "signup",
  );
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const companyLabel = invite?.companyName?.trim() || t("invite.companyFallback");
  const loginNext = `/invite/${encodeURIComponent(token)}`;

  if (!invite) {
    return (
      <InviteShell>
        <h1 className="mt-2 font-display text-3xl font-semibold text-charcoal">
          {t("invite.invalidTitle")}
        </h1>
        <p className="mt-3 text-muted">{t("invite.invalidBody")}</p>
        <Link
          href="/login"
          className="mt-8 inline-block rounded-quieter bg-ocean px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-ocean-deep"
        >
          {t("invite.goLogin")}
        </Link>
      </InviteShell>
    );
  }

  if (invite.status === "revoked") {
    return (
      <InviteShell>
        <h1 className="mt-2 font-display text-3xl font-semibold text-charcoal">
          {t("invite.revokedTitle")}
        </h1>
        <p className="mt-3 text-muted">{t("invite.revokedBody")}</p>
      </InviteShell>
    );
  }

  if (invite.status === "accepted" && !done) {
    return (
      <InviteShell>
        <h1 className="mt-2 font-display text-3xl font-semibold text-charcoal">
          {t("invite.usedTitle")}
        </h1>
        <p className="mt-3 text-muted">{t("invite.usedBody")}</p>
        <Link
          href="/login"
          className="mt-8 inline-block rounded-quieter bg-ocean px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-ocean-deep"
        >
          {t("invite.goLogin")}
        </Link>
      </InviteShell>
    );
  }

  if (done) {
    return (
      <InviteShell>
        <h1 className="mt-2 font-display text-3xl font-semibold text-charcoal">
          {t("invite.successTitle")}
        </h1>
        <p className="mt-3 text-muted">
          {t("invite.successBody", { company: companyLabel })}
        </p>
        <button
          type="button"
          onClick={() => {
            router.push("/");
            router.refresh();
          }}
          className="mt-8 rounded-quieter bg-ocean px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-ocean-deep"
        >
          {t("invite.enterStudio")}
        </button>
      </InviteShell>
    );
  }

  async function handleAcceptWhileSignedIn() {
    setError(null);
    startTransition(async () => {
      const result = await acceptInviteAction(token);
      if (result.error) {
        setError(result.error);
        return;
      }
      capture("team_invite_accepted", { method: "existing_account" });
      setDone(true);
    });
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const supabase = createClient();
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: invite!.email,
        password,
      });
      if (signInError) {
        setError(signInError.message);
        return;
      }
      const result = await acceptInviteAction(token);
      if (result.error) {
        setError(result.error);
        return;
      }
      if (signInData.user) {
        identifyUser({
          id: signInData.user.id,
          email: signInData.user.email,
          name: null,
          role: "partner",
          companyName: invite?.companyName ?? null,
          isAdmin: false,
        });
      }
      capture("team_invite_accepted", { method: "existing_account" });
      setDone(true);
      router.refresh();
    });
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const created = await createAccountFromInviteAction({
        token,
        password,
        displayName: displayName.trim() || undefined,
      });
      if (created.error) {
        setError(created.error);
        if (created.email) setMode("signin");
        return;
      }
      const supabase = createClient();
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: invite!.email,
        password,
      });
      if (signInError) {
        setError(signInError.message);
        return;
      }
      if (signInData.user) {
        identifyUser({
          id: signInData.user.id,
          email: signInData.user.email,
          name: displayName.trim() || null,
          role: "partner",
          companyName: invite?.companyName ?? null,
          isAdmin: false,
        });
      }
      capture("team_invite_accepted", { method: "new_account" });
      setDone(true);
      router.refresh();
    });
  }

  return (
    <InviteShell>
      <h1 className="mt-2 font-display text-3xl font-semibold text-charcoal sm:text-4xl">
        {t("invite.title")}
      </h1>
      <p className="mt-3 text-base leading-relaxed text-muted">
        {t("invite.subtitle", { company: companyLabel })}
      </p>
      <p className="mt-2 text-sm text-charcoal">
        {t("invite.forEmail", { email: invite.email })}
      </p>

      {isSignedIn ? (
        <div className="mt-8 space-y-4 rounded-soft border border-line/80 bg-white/80 p-7 shadow-[0_18px_50px_rgba(42,42,40,0.06)] backdrop-blur-sm">
          <p className="text-sm text-muted">
            {t("invite.signedInAs", { email: userEmail ?? "—" })}
          </p>
          {error && (
            <p className="text-sm text-red-700" role="alert">
              {error}
            </p>
          )}
          <button
            type="button"
            disabled={pending}
            onClick={handleAcceptWhileSignedIn}
            className="w-full rounded-quieter bg-ocean px-4 py-3 text-sm font-semibold text-white transition hover:bg-ocean-deep disabled:opacity-50"
          >
            {pending ? t("invite.accepting") : t("invite.accept")}
          </button>
          <p className="text-xs text-muted">{t("invite.mustMatchEmail")}</p>
        </div>
      ) : (
        <div className="mt-8 rounded-soft border border-line/80 bg-white/80 p-7 shadow-[0_18px_50px_rgba(42,42,40,0.06)] backdrop-blur-sm">
          <div className="mb-5 flex gap-2 border-b border-line/60 pb-3">
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={`rounded-quieter px-3 py-1.5 text-sm font-semibold transition ${
                mode === "signup"
                  ? "bg-ocean/10 text-ocean"
                  : "text-muted hover:text-charcoal"
              }`}
            >
              {t("invite.tabCreate")}
            </button>
            <button
              type="button"
              onClick={() => setMode("signin")}
              className={`rounded-quieter px-3 py-1.5 text-sm font-semibold transition ${
                mode === "signin"
                  ? "bg-ocean/10 text-ocean"
                  : "text-muted hover:text-charcoal"
              }`}
            >
              {t("invite.tabSignIn")}
            </button>
          </div>

          {mode === "signup" ? (
            <form onSubmit={handleSignUp} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-charcoal">
                  {t("login.email")}
                </label>
                <input
                  type="email"
                  value={invite.email}
                  readOnly
                  className="mt-1.5 block w-full rounded-quieter border border-line bg-sand/50 px-3.5 py-2.5 text-muted"
                />
              </div>
              <div>
                <label htmlFor="display-name" className="block text-sm font-medium text-charcoal">
                  {t("invite.displayName")}
                </label>
                <input
                  id="display-name"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  autoComplete="name"
                  className="mt-1.5 block w-full rounded-quieter border border-line bg-foam/60 px-3.5 py-2.5 text-charcoal outline-none transition focus:border-ocean focus:ring-2 focus:ring-ocean/20"
                />
              </div>
              <div>
                <label htmlFor="new-password" className="block text-sm font-medium text-charcoal">
                  {t("invite.setPassword")}
                </label>
                <input
                  id="new-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className="mt-1.5 block w-full rounded-quieter border border-line bg-foam/60 px-3.5 py-2.5 text-charcoal outline-none transition focus:border-ocean focus:ring-2 focus:ring-ocean/20"
                />
                <p className="mt-1 text-xs text-muted">{t("invite.passwordHint")}</p>
              </div>
              {error && (
                <p className="text-sm text-red-700" role="alert">
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={pending}
                className="w-full rounded-quieter bg-ocean px-4 py-3 text-sm font-semibold text-white transition hover:bg-ocean-deep disabled:opacity-50"
              >
                {pending ? t("invite.creating") : t("invite.createAndJoin")}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-charcoal">
                  {t("login.email")}
                </label>
                <input
                  type="email"
                  value={invite.email}
                  readOnly
                  className="mt-1.5 block w-full rounded-quieter border border-line bg-sand/50 px-3.5 py-2.5 text-muted"
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
                disabled={pending}
                className="w-full rounded-quieter bg-ocean px-4 py-3 text-sm font-semibold text-white transition hover:bg-ocean-deep disabled:opacity-50"
              >
                {pending ? t("invite.accepting") : t("invite.signInAndAccept")}
              </button>
              <p className="text-center text-xs text-muted">
                <Link
                  href={`/login?next=${encodeURIComponent(loginNext)}`}
                  className="text-ocean underline-offset-2 hover:underline"
                >
                  {t("invite.useLoginPage")}
                </Link>
              </p>
            </form>
          )}
        </div>
      )}
    </InviteShell>
  );
}

function InviteShell({ children }: { children: React.ReactNode }) {
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
        {children}
      </div>
    </div>
  );
}
