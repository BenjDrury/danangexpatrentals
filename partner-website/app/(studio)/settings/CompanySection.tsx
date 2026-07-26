"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { capture } from "@/lib/analytics";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { saveCompanySettings } from "./actions";

export type CompanyView = {
  id: string;
  name: string;
  logoUrl: string;
  contactPhone: string;
  contactWhatsapp: string;
  contactEmail: string;
};

export function CompanySection({ company }: { company: CompanyView }) {
  const { t } = useLocale();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [name, setName] = useState(company.name);
  const [logoUrl, setLogoUrl] = useState(company.logoUrl);
  const [contactPhone, setContactPhone] = useState(company.contactPhone);
  const [contactWhatsapp, setContactWhatsapp] = useState(company.contactWhatsapp);
  const [contactEmail, setContactEmail] = useState(company.contactEmail);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setName(company.name);
    setLogoUrl(company.logoUrl);
    setContactPhone(company.contactPhone);
    setContactWhatsapp(company.contactWhatsapp);
    setContactEmail(company.contactEmail);
  }, [company]);

  async function uploadLogo(file: File): Promise<string | null> {
    const supabase = createClient();
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${company.id}/logo-${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage.from("apartments").upload(path, file, {
      upsert: true,
      contentType: file.type || "image/jpeg",
    });
    if (uploadError) {
      setError(uploadError.message);
      return null;
    }
    const { data } = supabase.storage.from("apartments").getPublicUrl(path);
    return data.publicUrl;
  }

  function onPickLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    setMessage(null);
    void (async () => {
      const url = await uploadLogo(file);
      setUploading(false);
      if (url) {
        setLogoUrl(url);
        capture("partner_company_logo_uploaded");
        setMessage(t("settings.company.logoReady"));
      }
      if (fileRef.current) fileRef.current.value = "";
    })();
  }

  function removeLogo() {
    if (!logoUrl) return;
    setLogoUrl("");
    capture("partner_company_logo_removed");
    setMessage(t("settings.company.logoRemoved"));
  }

  return (
    <section className="space-y-5">
      <div>
        <h2 className="font-display text-xl font-semibold text-charcoal">
          {t("settings.company.title")}
        </h2>
        <p className="mt-1 max-w-lg text-sm text-muted">
          {t("settings.company.subtitle")}
        </p>
      </div>

      <form
        className="space-y-4 rounded-soft border border-line/70 bg-white/70 p-5 sm:p-6"
        onSubmit={(e) => {
          e.preventDefault();
          startTransition(async () => {
            setMessage(null);
            setError(null);
            const result = await saveCompanySettings({
              name,
              logoUrl,
              contactPhone,
              contactWhatsapp,
              contactEmail,
            });
            if (result.error) {
              setError(result.error);
              return;
            }
            setMessage(t("settings.company.saved"));
            capture("partner_company_updated", {
              name_changed: name.trim() !== company.name.trim(),
              has_logo: Boolean(logoUrl.trim()),
              has_phone: Boolean(contactPhone.trim()),
              has_whatsapp: Boolean(contactWhatsapp.trim()),
              has_contact_email: Boolean(contactEmail.trim()),
            });
            router.refresh();
          });
        }}
      >
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative h-16 w-16 overflow-hidden rounded-soft border border-line bg-sand/40">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs text-muted">
                {t("settings.company.logoEmpty")}
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onPickLogo}
            />
            <button
              type="button"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
              className="rounded-quieter border border-line bg-white px-3 py-2 text-sm font-medium text-charcoal transition hover:border-ocean/40 disabled:opacity-50"
            >
              {uploading
                ? t("settings.company.logoUploading")
                : t("settings.company.logoUpload")}
            </button>
            {logoUrl ? (
              <button
                type="button"
                onClick={removeLogo}
                className="rounded-quieter px-3 py-2 text-sm font-medium text-muted transition hover:text-coral-deep"
              >
                {t("settings.company.logoRemove")}
              </button>
            ) : null}
          </div>
        </div>

        <div>
          <label
            htmlFor="company-name"
            className="block text-sm font-medium text-charcoal"
          >
            {t("settings.company.name")}
          </label>
          <input
            id="company-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={120}
            autoComplete="organization"
            className="mt-1.5 block w-full rounded-quieter border border-line bg-foam/60 px-3.5 py-2.5 text-charcoal outline-none transition focus:border-ocean focus:ring-2 focus:ring-ocean/20"
          />
          <p className="mt-1.5 text-xs text-muted">
            {t("settings.company.nameHint")}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="company-phone"
              className="block text-sm font-medium text-charcoal"
            >
              {t("settings.company.phone")}
            </label>
            <input
              id="company-phone"
              type="tel"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              placeholder={t("settings.company.phonePlaceholder")}
              autoComplete="tel"
              className="mt-1.5 block w-full rounded-quieter border border-line bg-foam/60 px-3.5 py-2.5 text-charcoal outline-none transition focus:border-ocean focus:ring-2 focus:ring-ocean/20"
            />
          </div>
          <div>
            <label
              htmlFor="company-whatsapp"
              className="block text-sm font-medium text-charcoal"
            >
              {t("settings.company.whatsapp")}
            </label>
            <input
              id="company-whatsapp"
              type="text"
              value={contactWhatsapp}
              onChange={(e) => setContactWhatsapp(e.target.value)}
              placeholder={t("settings.company.whatsappPlaceholder")}
              className="mt-1.5 block w-full rounded-quieter border border-line bg-foam/60 px-3.5 py-2.5 text-charcoal outline-none transition focus:border-ocean focus:ring-2 focus:ring-ocean/20"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="company-email"
            className="block text-sm font-medium text-charcoal"
          >
            {t("settings.company.email")}
          </label>
          <input
            id="company-email"
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            placeholder={t("settings.company.emailPlaceholder")}
            autoComplete="email"
            className="mt-1.5 block w-full rounded-quieter border border-line bg-foam/60 px-3.5 py-2.5 text-charcoal outline-none transition focus:border-ocean focus:ring-2 focus:ring-ocean/20"
          />
          <p className="mt-1.5 text-xs text-muted">
            {t("settings.company.contactHint")}
          </p>
        </div>

        {(error || message) && (
          <p
            className={`text-sm ${error ? "text-red-700" : "text-palm"}`}
            role={error ? "alert" : "status"}
          >
            {error ?? message}
          </p>
        )}

        <button
          type="submit"
          disabled={pending || !name.trim()}
          className="rounded-quieter bg-ocean px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-ocean-deep disabled:opacity-50"
        >
          {pending ? t("settings.company.saving") : t("settings.company.save")}
        </button>
      </form>
    </section>
  );
}
