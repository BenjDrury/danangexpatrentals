"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { PARTNERS_WHATSAPP_URL } from "@/app/lib/contact-links";
import { CtaButton } from "@/app/components/CtaButton";
import { Section, SectionHero } from "@/app/components/sections";

type Locale = "en" | "vi";
const STORAGE_KEY = "partners-page-locale";

const copy = {
  en: {
    title: "For agents & owners",
    subtitle:
      "We match international renters with places that are actually available — and we’re always open to working with serious local partners.",
    intro:
      "If you manage apartments in Da Nang and want introductions to expats and remote workers who are ready to rent — short stays or longer leases — we’d like to hear from you.",
    bullets: [
      "We bring renters who already know their budget and timing.",
      "We prefer clear pricing, honest photos, and English-friendly communication.",
      "No hard sell — just a short conversation about whether it’s a fit.",
    ],
    whatsapp: "Message on WhatsApp",
    studioLogin: "Partner Studio login",
    rentInstead: "Looking to rent instead?",
    footer:
      "Already a partner? Open Partner Studio to manage listings, contacts, and share living guides with clients. New here? Start on WhatsApp with a quick note about your inventory and the areas you cover — we’ll take it from there.",
    back: "← Back to the site",
    lang: "Language",
  },
  vi: {
    title: "Dành cho môi giới & chủ nhà",
    subtitle:
      "Chúng tôi kết nối người thuê quốc tế với chỗ thực sự còn trống — và luôn sẵn sàng hợp tác với đối tác địa phương nghiêm túc.",
    intro:
      "Nếu bạn quản lý căn hộ ở Đà Nẵng và muốn được giới thiệu với expat, remote worker đang sẵn sàng thuê — ngắn hạn hoặc dài hạn — chúng tôi muốn nghe từ bạn.",
    bullets: [
      "Chúng tôi mang đến người thuê đã biết ngân sách và thời điểm.",
      "Chúng tôi thích giá rõ ràng, ảnh trung thực và giao tiếp thân thiện tiếng Anh.",
      "Không ép bán — chỉ một cuộc trò chuyện ngắn xem có phù hợp không.",
    ],
    whatsapp: "Nhắn WhatsApp",
    studioLogin: "Đăng nhập Partner Studio",
    rentInstead: "Bạn đang tìm thuê?",
    footer:
      "Đã là đối tác? Mở Partner Studio để quản lý tin đăng, liên hệ và chia sẻ hướng dẫn sống với khách. Mới đến? Bắt đầu trên WhatsApp với vài dòng về tồn kho và khu vực bạn cover — chúng tôi sẽ tiếp tục.",
    back: "← Về trang chính",
    lang: "Ngôn ngữ",
  },
} as const;

function partnerStudioUrl() {
  return process.env.NEXT_PUBLIC_PARTNER_URL?.replace(/\/$/, "") || "http://localhost:3002";
}

export function PartnersPageContent() {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw === "vi" || raw === "en") setLocaleState(raw);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  const t = copy[locale];

  return (
    <div className="min-h-screen bg-foam">
      <div className="absolute right-4 top-24 z-20 sm:right-8 sm:top-28">
        <div
          className="inline-flex items-center rounded-quieter border border-line/80 bg-white/80 p-0.5 text-xs font-semibold shadow-sm backdrop-blur-sm"
          role="group"
          aria-label={t.lang}
        >
          {(["en", "vi"] as const).map((opt) => {
            const active = locale === opt;
            return (
              <button
                key={opt}
                type="button"
                onClick={() => setLocale(opt)}
                className={`rounded-md px-2.5 py-1 transition ${
                  active ? "bg-ocean text-white shadow-sm" : "text-muted hover:text-charcoal"
                }`}
                aria-pressed={active}
              >
                {opt.toUpperCase()}
              </button>
            );
          })}
        </div>
      </div>

      <SectionHero variant="page" title={t.title} subtitle={t.subtitle} />

      <Section bg="bg-foam">
        <div className="mx-auto max-w-2xl">
          <p className="text-lg leading-relaxed text-muted">{t.intro}</p>

          <ul className="mt-10 space-y-5 text-base leading-relaxed text-muted">
            {t.bullets.map((bullet) => (
              <li key={bullet} className="flex gap-3">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-ocean" aria-hidden />
                <span>{bullet}</span>
              </li>
            ))}
          </ul>

          <div className="mt-12 flex flex-wrap gap-3">
            <CtaButton href={PARTNERS_WHATSAPP_URL} variant="primary">
              {t.whatsapp}
            </CtaButton>
            <CtaButton href={partnerStudioUrl()} variant="secondary">
              {t.studioLogin}
            </CtaButton>
            <CtaButton href="/contact" variant="secondary">
              {t.rentInstead}
            </CtaButton>
          </div>

          <p className="mt-8 text-sm text-muted">{t.footer}</p>

          <p className="mt-10 text-sm">
            <Link href="/" className="font-medium text-ocean transition hover:text-ocean-deep">
              {t.back}
            </Link>
          </p>
        </div>
      </Section>
    </div>
  );
}
