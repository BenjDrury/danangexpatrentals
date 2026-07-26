import { listingPriceLabel } from "types";
import { WHATSAPP_URL } from "./lib/contact-links";
import { getApartments, getAreas } from "@/lib/data";
import { apartmentPath, areaDisplayName, areaPath } from "@/lib/area-utils";
import {
  SectionApartmentCards,
  SectionCta,
  SectionHero,
  SectionMovingGuide,
  SectionNeighbourhoodGuides,
  SectionTrustTeaser,
} from "./components/sections";

export const revalidate = 60;

const HOME_LISTING_COUNT = 3;

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

function bedroomLabel(bedrooms: number): string {
  if (bedrooms === 0) return "Studio";
  return `${bedrooms} bedroom${bedrooms !== 1 ? "s" : ""}`;
}

export default async function Home() {
  const [apartments, areas] = await Promise.all([getApartments(), getAreas()]);
  const areaById = new Map(areas.map((a) => [a.id, a]));

  const cards = apartments
    .filter((apt) => Boolean(apt.main_image))
    .slice(0, HOME_LISTING_COUNT)
    .map((apt) => {
      const area = areaById.get(apt.area_id);
      return {
        image: apt.main_image,
        title: apt.title,
        price: listingPriceLabel(apt),
        location: area ? areaDisplayName(area) : "Da Nang",
        type: bedroomLabel(apt.bedrooms),
        features: (apt.features ?? []).slice(0, 3).map(String),
        href: apartmentPath(apt),
      };
    });

  const guides = NEIGHBOURHOODS.map((guide) => {
    const area = areaById.get(guide.id);
    return {
      ...guide,
      href: area ? areaPath(area) : `/areas/${guide.id}`,
    };
  });

  return (
    <div className="bg-foam">
      <SectionHero
        variant="home"
        title="Find your home in Da Nang"
        subtitle="Verified apartments and honest neighbourhood guides — for a few months or a few years."
        primaryCta={{ href: "/apartments", label: "Explore apartments" }}
        secondaryCta={{ href: "/areas", label: "See neighbourhoods" }}
      />

      {cards.length > 0 ? (
        <SectionApartmentCards
          heading="Apartments worth a look"
          description="A few verified places to start with — real photos, clear prices, short and longer stays."
          cards={cards}
          primaryCta={{ href: "/apartments", label: "Browse all apartments" }}
          secondaryCta={{ href: "/contact", label: "Get help finding one" }}
        />
      ) : (
        <SectionApartmentCards
          heading="Apartments worth a look"
          description="New verified homes are added carefully. Tell us your budget and timing — we’ll shortlist options within 24 hours."
          cards={[]}
          primaryCta={{ href: "/apartments", label: "Browse apartments" }}
          secondaryCta={{ href: "/contact", label: "Get matched" }}
        />
      )}

      <SectionNeighbourhoodGuides
        heading="Find your neighbourhood"
        description="Beach, cafés, city energy, or somewhere quieter — here’s a feel for the main areas."
        guides={guides}
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
        whatsapp={WHATSAPP_URL ? { href: WHATSAPP_URL } : undefined}
        partnersHref="/partners"
      />
    </div>
  );
}
