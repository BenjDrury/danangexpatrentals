import type { Metadata } from "next";
import { Manrope, Outfit } from "next/font/google";
import { AppProviders } from "@/components/AppProviders";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-display",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "Partner Studio · Da Nang Expat Rentals",
  description:
    "A calm property studio for Da Nang partners — manage listings, contacts, and share trust content with clients.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${outfit.variable} ${manrope.variable}`}>
      <body className="font-sans bg-foam text-charcoal antialiased">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
