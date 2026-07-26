"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import type { MessageKey } from "@/lib/i18n/messages";
import type { CompanyFacebookGroup } from "@/lib/data/facebook-groups";
import type { TeamInviteRow, TeamMember } from "@/lib/data/team";
import {
  addFacebookGroup,
  disconnectFacebook,
  inviteTeamMember,
  removeFacebookGroup,
  revokeTeamInvite,
} from "./actions";
import posthog from "posthog-js";

export type FacebookIntegrationView = {
  status: "connected" | "disconnected";
  pageName: string | null;
  connectedAt: string | null;
};

const FB_FLASH: Record<string, MessageKey> = {
  connected: "settings.fb.flash.connected",
  denied: "settings.fb.flash.denied",
  error: "settings.fb.flash.error",
  no_page: "settings.fb.flash.noPage",
  not_configured: "settings.fb.notConfigured",
};

export function SettingsView({
  facebook,
  oauthConfigured,
  flash,
  members,
  invites,
  missingServiceRole,
  facebookGroups,
}: {
  facebook: FacebookIntegrationView | null;
  oauthConfigured: boolean;
  flash: string | null;
  members: TeamMember[];
  invites: TeamInviteRow[];
  missingServiceRole?: boolean;
  facebookGroups: CompanyFacebookGroup[];
}) {
  const { t } = useLocale();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [groupUrl, setGroupUrl] = useState("");
  const [lastInviteUrl, setLastInviteUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const connected = facebook?.status === "connected";

  const flashKey = flash ? FB_FLASH[flash] : undefined;
  const flashText = flashKey ? t(flashKey) : null;

  const pendingInvites = useMemo(
    () => invites.filter((i) => i.status === "pending"),
    [invites],
  );

  function absoluteInviteUrl(path: string): string {
    if (typeof window === "undefined") return path;
    return new URL(path, window.location.origin).toString();
  }

  return (
    <div className="space-y-6 animate-fade-up">
      <div>
        <h1 className="font-display text-2xl font-semibold text-charcoal">
          {t("settings.title")}
        </h1>
        <p className="mt-1 max-w-xl text-sm text-muted">{t("settings.subtitle")}</p>
      </div>

      {(flashText || message) && (
        <p
          className={`rounded-quieter px-4 py-3 text-sm ${
            flash === "error" ||
            flash === "denied" ||
            flash === "no_page" ||
            flash === "not_configured"
              ? "bg-coral-soft text-coral-deep"
              : "bg-palm-soft text-palm"
          }`}
          role="status"
        >
          {message ?? flashText}
        </p>
      )}

      <section className="space-y-5">
        <div>
          <h2 className="font-display text-xl font-semibold text-charcoal">
            {t("settings.team.title")}
          </h2>
          <p className="mt-1 max-w-lg text-sm text-muted">
            {t("settings.team.subtitle")}
          </p>
        </div>

        {missingServiceRole && (
          <p className="rounded-quieter bg-sand px-4 py-3 text-sm text-muted" role="status">
            {t("settings.team.missingServiceRole")}
          </p>
        )}

        <div className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted">
            {t("settings.team.members")}
          </h3>
          {members.length === 0 ? (
            <p className="text-sm text-muted">{t("settings.team.membersEmpty")}</p>
          ) : (
            <ul className="divide-y divide-line/60 rounded-soft border border-line/70 bg-white/70">
              {members.map((m) => (
                <li
                  key={m.profileId}
                  className="flex flex-col gap-0.5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-charcoal">
                      {m.displayName?.trim() || t("settings.team.unnamed")}
                    </p>
                    <p className="truncate text-sm text-muted">
                      {m.email ?? t("settings.team.noEmail")}
                    </p>
                  </div>
                  <span className="mt-1 shrink-0 text-xs font-semibold uppercase tracking-wide text-ocean sm:mt-0">
                    {m.role === "admin"
                      ? t("settings.team.role.admin")
                      : t("settings.team.role.partner")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted">
            {t("settings.team.inviteTitle")}
          </h3>
          <form
            className="flex flex-col gap-3 sm:flex-row sm:items-end"
            onSubmit={(e) => {
              e.preventDefault();
              const email = inviteEmail.trim();
              if (!email) return;
              startTransition(async () => {
                setMessage(null);
                setCopied(false);
                const result = await inviteTeamMember(email);
                if (result.error) {
                  setMessage(result.error);
                  setLastInviteUrl(null);
                  return;
                }
                const path = result.inviteUrl ?? (result.token ? `/invite/${result.token}` : null);
                if (path) {
                  setLastInviteUrl(absoluteInviteUrl(path));
                  setMessage(t("settings.team.inviteCreated"));
                  setInviteEmail("");
                  posthog.capture("team_member_invited");
                }
                router.refresh();
              });
            }}
          >
            <div className="min-w-0 flex-1">
              <label htmlFor="invite-email" className="block text-sm font-medium text-charcoal">
                {t("settings.team.inviteEmail")}
              </label>
              <input
                id="invite-email"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder={t("settings.team.invitePlaceholder")}
                className="mt-1.5 block w-full rounded-quieter border border-line bg-foam/60 px-3.5 py-2.5 text-charcoal outline-none transition focus:border-ocean focus:ring-2 focus:ring-ocean/20"
              />
            </div>
            <button
              type="submit"
              disabled={pending}
              className="rounded-quieter bg-ocean px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-ocean-deep disabled:opacity-50"
            >
              {pending ? t("settings.team.inviting") : t("settings.team.inviteSubmit")}
            </button>
          </form>

          {lastInviteUrl && (
            <div className="rounded-soft border border-palm/30 bg-palm-soft/40 px-4 py-3 space-y-2">
              <p className="text-sm font-medium text-palm">{t("settings.team.inviteLinkLabel")}</p>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <code className="min-w-0 flex-1 truncate rounded-quieter bg-white/80 px-3 py-2 text-xs text-charcoal">
                  {lastInviteUrl}
                </code>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(lastInviteUrl);
                      setCopied(true);
                      window.setTimeout(() => setCopied(false), 1800);
                    } catch {
                      setCopied(false);
                    }
                  }}
                  className="shrink-0 rounded-quieter border border-line bg-white px-3 py-2 text-sm font-medium text-charcoal transition hover:border-ocean/40"
                >
                  {copied ? t("copy.copied") : t("copy.default")}
                </button>
              </div>
            </div>
          )}
        </div>

        {pendingInvites.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted">
              {t("settings.team.pendingInvites")}
            </h3>
            <ul className="divide-y divide-line/60 rounded-soft border border-line/70 bg-white/70">
              {pendingInvites.map((inv) => (
                <li
                  key={inv.id}
                  className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-charcoal">{inv.email}</p>
                    <p className="text-xs text-muted">
                      {t("settings.team.invitedAt", {
                        date: new Date(inv.createdAt).toLocaleDateString(),
                      })}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={async () => {
                        const url = absoluteInviteUrl(`/invite/${inv.token}`);
                        try {
                          await navigator.clipboard.writeText(url);
                          setMessage(t("settings.team.linkCopied"));
                        } catch {
                          setLastInviteUrl(url);
                        }
                      }}
                      className="rounded-quieter border border-line bg-white px-3 py-1.5 text-sm font-medium text-charcoal transition hover:border-ocean/40"
                    >
                      {t("settings.team.copyLink")}
                    </button>
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => {
                        startTransition(async () => {
                          const result = await revokeTeamInvite(inv.id);
                          setMessage(
                            result.error ?? t("settings.team.inviteRevoked"),
                          );
                          if (!result.error) router.refresh();
                        });
                      }}
                      className="rounded-quieter border border-line bg-white px-3 py-1.5 text-sm font-medium text-coral transition hover:border-coral/40 disabled:opacity-50"
                    >
                      {t("settings.team.revoke")}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <section className="space-y-5">
        <div>
          <h2 className="font-display text-xl font-semibold text-charcoal">
            {t("settings.groups.title")}
          </h2>
          <p className="mt-1 max-w-lg text-sm text-muted">
            {t("settings.groups.subtitle")}
          </p>
        </div>

        {facebookGroups.length === 0 ? (
          <p className="text-sm text-muted">{t("settings.groups.empty")}</p>
        ) : (
          <ul className="divide-y divide-line/60 rounded-soft border border-line/70 bg-white/70">
            {facebookGroups.map((g) => (
              <li
                key={g.linkId}
                className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5"
              >
                <div className="min-w-0">
                  <p className="font-medium text-charcoal">{g.name}</p>
                  <p className="truncate text-sm text-muted">{g.url}</p>
                  <p className="mt-0.5 text-xs text-muted">
                    {g.source === "catalog"
                      ? t("settings.groups.source.catalog")
                      : t("settings.groups.source.manual")}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <a
                    href={g.url}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-quieter border border-line bg-white px-3 py-1.5 text-sm font-medium text-ocean transition hover:border-ocean/40"
                  >
                    {t("settings.groups.open")}
                  </a>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => {
                      startTransition(async () => {
                        const result = await removeFacebookGroup(g.linkId);
                        setMessage(result.error ?? t("settings.groups.removed"));
                        if (!result.error) router.refresh();
                      });
                    }}
                    className="rounded-quieter border border-line bg-white px-3 py-1.5 text-sm font-medium text-coral transition hover:border-coral/40 disabled:opacity-50"
                  >
                    {t("settings.groups.remove")}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <form
          className="flex flex-col gap-3 sm:flex-row sm:items-end"
          onSubmit={(e) => {
            e.preventDefault();
            const url = groupUrl.trim();
            if (!url) return;
            startTransition(async () => {
              setMessage(null);
              const result = await addFacebookGroup(url);
              if (result.error) {
                setMessage(result.error);
                return;
              }
              setGroupUrl("");
              setMessage(t("settings.groups.added"));
              router.refresh();
            });
          }}
        >
          <label className="block min-w-0 flex-1">
            <span className="text-sm font-medium text-charcoal">
              {t("settings.groups.addLabel")}
            </span>
            <input
              type="url"
              required
              value={groupUrl}
              onChange={(e) => setGroupUrl(e.target.value)}
              placeholder={t("settings.groups.addPlaceholder")}
              className="mt-1.5 block w-full rounded-quieter border border-line bg-foam/70 px-3.5 py-2.5 text-charcoal outline-none transition focus:border-ocean focus:ring-2 focus:ring-ocean/20"
            />
          </label>
          <button
            type="submit"
            disabled={pending}
            className="rounded-quieter bg-ocean px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-ocean-deep disabled:opacity-50"
          >
            {pending ? t("settings.groups.adding") : t("settings.groups.addSubmit")}
          </button>
        </form>
      </section>

      <section className="space-y-5">
        <div>
          <h2 className="font-display text-xl font-semibold text-charcoal">
            {t("settings.integrations.title")}
          </h2>
          <p className="mt-1 max-w-lg text-sm text-muted">
            {t("settings.integrations.subtitle")}
          </p>
        </div>

        <ul className="space-y-3">
          <li className="flex flex-col gap-4 rounded-soft border border-line/70 bg-white/70 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div className="min-w-0 space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-display text-lg font-semibold text-charcoal">
                  {t("settings.fb.title")}
                </p>
                <span
                  className={`rounded-quieter px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${
                    connected
                      ? "bg-palm-soft text-palm"
                      : "bg-sand text-muted"
                  }`}
                >
                  {connected
                    ? t("settings.fb.status.connected")
                    : t("settings.fb.status.disconnected")}
                </span>
              </div>
              <p className="text-sm text-muted">{t("settings.fb.description")}</p>
              <p className="text-sm text-charcoal">
                {connected && facebook?.pageName
                  ? t("settings.fb.connectedAs", { name: facebook.pageName })
                  : t("settings.fb.notConnected")}
              </p>
              <p className="text-xs text-muted">{t("settings.fb.comingSoon")}</p>
              {!oauthConfigured && (
                <p className="text-xs text-amber">{t("settings.fb.notConfigured")}</p>
              )}
            </div>

            <div className="flex shrink-0 flex-wrap gap-2">
              {connected ? (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => {
                    startTransition(async () => {
                      const result = await disconnectFacebook();
                      setMessage(
                        result.error ?? t("settings.fb.flash.disconnected"),
                      );
                      if (!result.error) router.refresh();
                    });
                  }}
                  className="rounded-quieter border border-line bg-white px-4 py-2.5 text-sm font-medium text-charcoal transition hover:border-coral/40 hover:text-coral disabled:opacity-50"
                >
                  {pending ? t("settings.fb.disconnecting") : t("settings.fb.disconnect")}
                </button>
              ) : oauthConfigured ? (
                <a
                  href="/api/integrations/facebook/connect"
                  className="rounded-quieter bg-ocean px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-ocean-deep"
                >
                  {t("settings.fb.connect")}
                </a>
              ) : (
                <button
                  type="button"
                  disabled
                  title={t("settings.fb.notConfigured")}
                  className="cursor-not-allowed rounded-quieter bg-ocean/40 px-4 py-2.5 text-sm font-semibold text-white"
                >
                  {t("settings.fb.connect")}
                </button>
              )}
            </div>
          </li>
        </ul>
      </section>

      <section className="space-y-5">
        <div>
          <h2 className="font-display text-xl font-semibold text-charcoal">
            {t("settings.legal.title")}
          </h2>
          <p className="mt-1 max-w-lg text-sm text-muted">
            {t("settings.legal.subtitle")}
          </p>
        </div>
        <ul className="divide-y divide-line/60 rounded-soft border border-line/70 bg-white/70">
          <li>
            <Link
              href="/terms"
              className="flex items-center justify-between gap-3 px-4 py-3 text-sm font-medium text-charcoal transition hover:bg-foam/50 sm:px-5"
            >
              <span>{t("settings.legal.terms")}</span>
              <span aria-hidden className="text-muted">
                →
              </span>
            </Link>
          </li>
          <li>
            <Link
              href="/privacy"
              className="flex items-center justify-between gap-3 px-4 py-3 text-sm font-medium text-charcoal transition hover:bg-foam/50 sm:px-5"
            >
              <span>{t("settings.legal.privacy")}</span>
              <span aria-hidden className="text-muted">
                →
              </span>
            </Link>
          </li>
        </ul>
      </section>
    </div>
  );
}
