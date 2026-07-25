import { WHATSAPP_URL } from "./lib/contact-links";
import {
  SectionApartmentCards,
  SectionCta,
  SectionHero,
  SectionMovingGuide,
  SectionNeighbourhoodGuides,
  SectionTrustTeaser,
} from "./components/sections";

const CURATED_APARTMENTS = [
  {
    image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=900&q=80",
    title: "Bright 1BR near the beach",
    price: "$480/mo",
    location: "My Khe",
    type: "1 bedroom · Furnished",
    features: ["5 min walk to beach", "Natural light", "Flexible lease"],
    href: "/apartments",
  },
  {
    image: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=900&q=80",
    title: "Studio in the café strip",
    price: "$320/mo",
    location: "An Thuong",
    type: "Studio",
    features: ["Balcony", "Near coworking", "Utilities separate"],
    href: "/apartments",
  },
  {
    image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=900&q=80",
    title: "Serviced 2BR, ready to stay",
    price: "$720/mo",
    location: "My An",
    type: "2 bedroom · Serviced",
    features: ["Cleaning included", "Quiet street", "Short or long stays"],
    href: "/apartments",
  },
];

const NEIGHBOURHOODS = [
  {
    id: "DN-A",
    name: "My An & An Thuong",
    tagline: "Remote work friendly",
    description: "Cafés, coworking, and an easy beach rhythm — a popular first base in Da Nang.",
    image: "/danang-my-khe.jpg",
  },
  {
    id: "DN-B",
    name: "Son Tra",
    tagline: "Beach lifestyle",
    description: "Long stretches of sand, ocean mornings, and a calmer coastal pace.",
    image: "/danang-my-khe-hotels.jpg",
  },
  {
    id: "DN-C",
    name: "Hai Chau",
    tagline: "City living",
    description: "Closer to the Han River, markets, and everyday Vietnamese city life.",
    image: "/danang-dragon-bridge.jpeg",
  },
  {
    id: "DN-E",
    name: "FPT / Hoa Hai",
    tagline: "Quieter stays",
    description: "More space and a slower rhythm — nice for longer stays and families.",
    image: "/danang-hands.jpg",
  },
];

export default function Home() {
  return (
    <div className="bg-foam">
      <SectionHero
        variant="home"
        title="Find your home in Da Nang"
        subtitle="Verified apartments and honest neighbourhood guides — for a few months or a few years."
        primaryCta={{ href: "/apartments", label: "Explore apartments" }}
        secondaryCta={{ href: "/areas", label: "See neighbourhoods" }}
      />

      <SectionApartmentCards
        heading="Apartments worth a look"
        description="A few verified places to start with — real photos, clear prices, short and longer stays."
        cards={CURATED_APARTMENTS}
        primaryCta={{ href: "/apartments", label: "Browse all apartments" }}
        secondaryCta={{ href: "/contact", label: "Get help finding one" }}
      />

      <SectionNeighbourhoodGuides
        heading="Find your neighbourhood"
        description="Beach, cafés, city energy, or somewhere quieter — here’s a feel for the main areas."
        guides={NEIGHBOURHOODS}
      />

      <SectionTrustTeaser
        heading="What you can expect from us"
        description="We shortlist real apartments and help you understand the area — so choosing a place feels clearer."
        linkLabel="How we work"
      />

      <SectionMovingGuide />

      <SectionCta
        bg="bg-foam"
        title="Tell us what you’re looking for"
        subtitle="Share your budget and timing — we’ll send a few solid options within 24 hours."
        primaryCta={{ href: "/contact", label: "Get matched" }}
        secondaryCta={{ href: "/how-it-works", label: "How it works" }}
        whatsapp={{ href: WHATSAPP_URL }}
        partnersHref="/partners"
      />
    </div>
  );
}
