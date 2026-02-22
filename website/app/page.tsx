import { WHATSAPP_NUMBER } from "backend";
import Link from "next/link";
import {
  SectionApartmentCards,
  SectionCta,
  SectionHero,
  SectionTrustTeaser,
  SectionWhatsAppCta,
  SectionWithImage,
} from "./components/sections";

const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER.replace(/\D/g, "")}`;

const EXAMPLE_APARTMENTS = [
  {
    image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&q=80",
    title: "Modern 1BR near My Khe Beach",
    price: "$480/month",
    location: "My Khe",
    features: ["Furnished", "5 min walk to beach", "6-month lease possible"],
  },
  {
    image: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=600&q=80",
    title: "Studio in An Thuong expat area",
    price: "$320/month",
    location: "An Thuong",
    features: ["Balcony", "Utilities separate", "Available March"],
  },
  {
    image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&q=80",
    title: "2BR serviced apartment near cafes",
    price: "$720/month",
    location: "My An",
    features: ["Cleaning included", "Quiet street", "Flexible lease"],
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50">
      <SectionHero
        variant="home"
        title="Verified apartments in Da Nang — no scams, no stress."
        subtitle="We help expats and remote workers find trusted rentals. Tell us your budget and move date — we'll send you real options within 24 hours."
        primaryCta={{ href: "/contact", label: "Get apartment matches" }}
        secondaryCta={{ href: WHATSAPP_URL, label: "Message us on WhatsApp" }}
      />

      <SectionWithImage
        bg="bg-white"
        imageSrc="/danang-my-khe.jpg"
        imageAlt="My Khe Beach and Da Nang coastline"
        imageSide="right"
      >
        <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
          Beach, city, and mountains
        </h2>
        <p className="mt-4 text-lg text-slate-600">
          Da Nang gives you the coast, a growing city, and easy trips to places like Ba Na Hills. 
          We help you find a base that fits how you want to live — beachfront, café strip, or somewhere quieter.
        </p>
        <Link
          href="/areas"
          className="mt-6 inline-flex font-semibold text-teal-600 hover:text-teal-700"
        >
          Explore areas →
        </Link>
      </SectionWithImage>

      <SectionTrustTeaser
        heading="Why foreigners trust us"
        description="Verified apartments only. English-friendly agents. Transparent pricing. We fix the usual chaos of renting in Da Nang as an expat."
        linkHref="/why-us"
        linkLabel="Learn more about us →"
        testimonials={[
          { quote: "Found my apartment within 3 days after arriving.", author: "Mark, UK" },
          { quote: "Way easier than dealing with random Facebook agents.", author: "Lisa, Germany" },
        ]}
      />

      <SectionWithImage
        bg="bg-slate-50"
        imageSrc="/danang-dragon-bridge.jpeg"
        imageAlt="Dragon Bridge over Han River at sunset"
        imageSide="left"
      >
        <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
          A city that works for expats
        </h2>
        <p className="mt-4 text-lg text-slate-600">
          From the Dragon Bridge to the Han River waterfront, Da Nang has become a real hub for remote workers and families. 
          We only work with agents who speak English and list places we’ve actually verified.
        </p>
      </SectionWithImage>

      <SectionApartmentCards
        heading="Example apartments we help expats find"
        cards={EXAMPLE_APARTMENTS}
        secondaryCta={{ href: "/apartments", label: "See more options & area guides" }}
        primaryCta={{ href: "/contact", label: "Tell us your budget — get matches" }}
      />

      <SectionWithImage
        bg="bg-white"
        imageSrc="/danang-hands.jpg"
        imageAlt="Golden Bridge at Ba Na Hills"
        imageSide="right"
      >
        <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
          Explore once you’re here
        </h2>
        <p className="mt-4 text-lg text-slate-600">
          Weekends at Ba Na Hills, mornings at the beach, evenings by the river. 
          Find your apartment first — then make the most of the city.
        </p>
        <Link
          href="/moving-guide"
          className="mt-6 inline-flex font-semibold text-teal-600 hover:text-teal-700"
        >
          Moving to Da Nang guide →
        </Link>
      </SectionWithImage>

      <SectionCta
        bg="bg-amber-50/30"
        title="Tell us what you need — we'll send real options in 24h."
        subtitle={
          <>
            Free. No spam. No obligation.{" "}
            <Link href="/how-it-works" className="text-teal-600 font-medium hover:underline">
              See how it works
            </Link>
            .
          </>
        }
        primaryCta={{ href: "/contact", label: "Get apartment matches" }}
        secondaryCta={{ href: WHATSAPP_URL, label: "Chat on WhatsApp" }}
      />

      <SectionWhatsAppCta
        title="Already in Da Nang?"
        description="Message us now and we'll help you find a place faster."
        whatsappUrl={WHATSAPP_URL}
      />
    </div>
  );
}
