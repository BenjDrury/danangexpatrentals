import type { Metadata } from "next";
import { Manrope, Outfit } from "next/font/google";
import { WHATSAPP_NUMBER } from "backend";
import { Footer } from "./components/Footer";
import { Nav } from "./components/Nav";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-display",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-body",
});

const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER.replace(/\D/g, "")}`;

export const metadata: Metadata = {
  title: "Da Nang Expat Rentals — Find your home in Da Nang",
  description:
    "Verified apartments, honest neighbourhood guides, and friendly help finding a place to stay in Da Nang — short-term or long-term.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${outfit.variable} ${manrope.variable}`}>
      <body className="font-sans flex min-h-screen flex-col bg-foam text-charcoal">
        <Nav />
        <main className="flex-1">{children}</main>
        <Footer whatsappUrl={whatsappUrl} />
      </body>
    </html>
  );
}
