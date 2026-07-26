import type { Metadata } from "next";
import { Manrope, Outfit } from "next/font/google";
import { Footer } from "./components/Footer";
import { Nav } from "./components/Nav";
import { WHATSAPP_URL } from "./lib/contact-links";
import {
  DEFAULT_DESCRIPTION,
  DEFAULT_OG_IMAGE_HEIGHT,
  DEFAULT_OG_IMAGE_PATH,
  DEFAULT_OG_IMAGE_WIDTH,
  SITE_NAME,
  SITE_TAGLINE,
  absoluteUrl,
  getSiteUrl,
  organizationJsonLd,
} from "@/lib/seo";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-display",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-body",
});

const siteUrl = getSiteUrl();
const defaultOgImage = absoluteUrl(DEFAULT_OG_IMAGE_PATH);
const defaultTitle = `${SITE_NAME} — ${SITE_TAGLINE}`;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: defaultTitle,
    template: `%s | ${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "Da Nang apartments",
    "Da Nang rentals",
    "expat housing Da Nang",
    "Da Nang long term rental",
    "verified apartments Vietnam",
  ],
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: SITE_NAME,
    title: defaultTitle,
    description: DEFAULT_DESCRIPTION,
    images: [
      {
        url: defaultOgImage,
        width: DEFAULT_OG_IMAGE_WIDTH,
        height: DEFAULT_OG_IMAGE_HEIGHT,
        alt: "Da Nang coastline — Da Nang Expat Rentals",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: defaultTitle,
    description: DEFAULT_DESCRIPTION,
    images: [defaultOgImage],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const orgLd = organizationJsonLd();

  return (
    <html lang="en" className={`${outfit.variable} ${manrope.variable}`}>
      <body className="font-sans flex min-h-screen flex-col bg-foam text-charcoal">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgLd) }}
        />
        <Nav />
        <main className="flex-1">{children}</main>
        <Footer whatsappUrl={WHATSAPP_URL} />
      </body>
    </html>
  );
}
