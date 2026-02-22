import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export const metadata: Metadata = {
  title: "Da Nang Expat Rentals — Verified Apartments, No Scams",
  description:
    "We help expats and remote workers find trusted rentals in Da Nang. Tell us your budget and move date — we'll send suitable apartments within 24 hours.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={dmSans.variable}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
