"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { capture } from "@/lib/analytics";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { savePartnerProfile } from "./actions";

export type ProfileView = {
  userId: string;
  loginEmail: string | null;
  displayName: string;
  avatarUrl: string;
  phone: string;
  whatsapp: string;
  contactEmail: string;
  bio: string;
};

export function ProfileSection({ profile }: { profile: ProfileView }) {
  const { t } = useLocale();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [displayName, setDisplayName] = useState(profile.displayName);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl);
  const [phone, setPhone] = useState(profile.phone);
  const [whatsapp, setWhatsapp] = useState(profile.whatsapp);
  const [contactEmail, setContactEmail] = useState(profile.contactEmail);
  const [bio, setBio] = useState(profile.bio);

  useEffect(() => {
    setDisplayName(profile.displayName);
    setAvatarUrl(profile.avatarUrl);
    setPhone(profile.phone);
    setWhatsapp(profile.whatsapp);
    setContactEmail(profile.contactEmail);
    setBio(profile.bio);
  }, [profile]);

  async function uploadAvatar(file: File): Promise<string | null> {
    const supabase = createClient();
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${profile.userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, {
      upsert: false,
      contentType: file.type || "image/jpeg",
    });
    if (uploadError) {
      setError(uploadError.message);
      return null;
    }
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    return data.publicUrl;
  }

  function onPickPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    setMessage(null);
    void (async () => {
      const url = await uploadAvatar(file);
      setUploading(false);
      if (url) {
        setAvatarUrl(url);
        capture("partner_profile_photo_uploaded");
        setMessage(t("settings.profile.photoReady"));
      }
      if (fileRef.current) fileRef.current.value = "";
    })();
  }

  function removePhoto() {
    if (!avatarUrl) return;
    setAvatarUrl("");
    capture("partner_profile_photo_removed");
    setMessage(t("settings.profile.photoRemoved"));
  }

  return (
    <section className="space-y-5">
      <div>
        <h2 className="font-display text-xl font-semibold text-charcoal">
          {t("settings.profile.title")}
        </h2>
        <p className="mt-1 max-w-lg text-sm text-muted">
          {t("settings.profile.subtitle")}
        </p>
      </div>

      <form
        className="space-y-5 rounded-soft border border-line/70 bg-white/70 px-4 py-5 sm:px-5"
        onSubmit={(e) => {
          e.preventDefault();
          startTransition(async () => {
            setError(null);
            setMessage(null);
            const result = await savePartnerProfile({
              displayName,
              phone,
              whatsapp,
              contactEmail,
              bio,
              avatarUrl,
            });
            if (result.error) {
              setError(result.error);
              return;
            }
            capture("partner_profile_updated", {
              has_avatar: Boolean(avatarUrl.trim()),
              has_phone: Boolean(phone.trim()),
              has_whatsapp: Boolean(whatsapp.trim()),
              has_contact_email: Boolean(contactEmail.trim()),
              has_bio: Boolean(bio.trim()),
            });
            setMessage(t("settings.profile.saved"));
            router.refresh();
          });
        }}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="flex shrink-0 flex-col items-start gap-2">
            <div className="relative h-24 w-24 overflow-hidden rounded-soft bg-sand ring-1 ring-line/70">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarUrl}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-2xl font-semibold text-muted">
                  {(displayName.trim() || profile.loginEmail || "?").charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="sr-only"
              onChange={onPickPhoto}
            />
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={uploading || pending}
                onClick={() => fileRef.current?.click()}
                className="rounded-quieter border border-line bg-white px-3 py-1.5 text-sm font-medium text-charcoal transition hover:border-ocean/40 disabled:opacity-50"
              >
                {uploading
                  ? t("settings.profile.uploading")
                  : avatarUrl
                    ? t("settings.profile.changePhoto")
                    : t("settings.profile.uploadPhoto")}
              </button>
              {avatarUrl ? (
                <button
                  type="button"
                  disabled={uploading || pending}
                  onClick={removePhoto}
                  className="rounded-quieter border border-line bg-white px-3 py-1.5 text-sm font-medium text-coral transition hover:border-coral/40 disabled:opacity-50"
                >
                  {t("settings.profile.removePhoto")}
                </button>
              ) : null}
            </div>
          </div>

          <div className="min-w-0 flex-1 space-y-4">
            <label className="block text-sm">
              <span className="font-medium text-charcoal">
                {t("settings.profile.displayName")}
              </span>
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                autoComplete="name"
                className="mt-1.5 block w-full rounded-quieter border border-line bg-foam/60 px-3.5 py-2.5 text-charcoal outline-none transition focus:border-ocean focus:ring-2 focus:ring-ocean/20"
              />
            </label>

            {profile.loginEmail ? (
              <p className="text-sm text-muted">
                {t("settings.profile.loginEmail", { email: profile.loginEmail })}
              </p>
            ) : null}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="font-medium text-charcoal">{t("settings.profile.phone")}</span>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              autoComplete="tel"
              placeholder={t("settings.profile.phonePlaceholder")}
              className="mt-1.5 block w-full rounded-quieter border border-line bg-foam/60 px-3.5 py-2.5 text-charcoal outline-none transition focus:border-ocean focus:ring-2 focus:ring-ocean/20"
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-charcoal">{t("settings.profile.whatsapp")}</span>
            <input
              type="tel"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder={t("settings.profile.whatsappPlaceholder")}
              className="mt-1.5 block w-full rounded-quieter border border-line bg-foam/60 px-3.5 py-2.5 text-charcoal outline-none transition focus:border-ocean focus:ring-2 focus:ring-ocean/20"
            />
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="font-medium text-charcoal">
              {t("settings.profile.contactEmail")}
            </span>
            <span className="mt-0.5 block text-xs text-muted">
              {t("settings.profile.contactEmailHint")}
            </span>
            <input
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              autoComplete="email"
              placeholder={t("settings.profile.contactEmailPlaceholder")}
              className="mt-1.5 block w-full rounded-quieter border border-line bg-foam/60 px-3.5 py-2.5 text-charcoal outline-none transition focus:border-ocean focus:ring-2 focus:ring-ocean/20"
            />
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="font-medium text-charcoal">{t("settings.profile.bio")}</span>
            <span className="mt-0.5 block text-xs text-muted">
              {t("settings.profile.bioHint")}
            </span>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder={t("settings.profile.bioPlaceholder")}
              className="mt-1.5 block w-full rounded-quieter border border-line bg-foam/60 px-3.5 py-2.5 text-charcoal outline-none transition focus:border-ocean focus:ring-2 focus:ring-ocean/20"
            />
          </label>
        </div>

        {(error || message) && (
          <p
            className={`rounded-quieter px-4 py-3 text-sm ${
              error ? "bg-coral-soft text-coral-deep" : "bg-palm-soft text-palm"
            }`}
            role="status"
          >
            {error ?? message}
          </p>
        )}

        <button
          type="submit"
          disabled={pending || uploading}
          className="rounded-quieter bg-ocean px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-ocean-deep disabled:opacity-50"
        >
          {pending ? t("settings.profile.saving") : t("settings.profile.save")}
        </button>
      </form>
    </section>
  );
}
