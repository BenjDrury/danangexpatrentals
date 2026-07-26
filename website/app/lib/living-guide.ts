export type GuidePriceRow = {
  item: string;
  price: string;
  note?: string;
};

export type GuideBlock =
  | { type: "intro"; text: string }
  | { type: "prices"; title: string; rows: GuidePriceRow[]; footnote?: string }
  | { type: "list"; title: string; items: string[] }
  | {
      type: "paragraph";
      title?: string;
      text: string;
      /** Optional deep link (e.g. to an area page or official site) */
      href?: string;
      linkLabel?: string;
      external?: boolean;
    }
  | {
      type: "links";
      title: string;
      items: { label: string; href: string; note?: string; external?: boolean }[];
    }
  | { type: "tips"; title: string; items: string[] }
  | {
      type: "figure";
      src: string;
      alt: string;
      caption?: string;
    }
  | {
      type: "tour";
      title: string;
      tagline: string;
      image: { src: string; alt: string; credit?: string };
      duration: string;
      cost: string;
      steps: string[];
      tip?: string;
      href?: string;
      linkLabel?: string;
    };

export type GuideArticle = {
  slug: string;
  title: string;
  hubLabel: string;
  summary: string;
  description: string;
  blocks: GuideBlock[];
};

export const GUIDE_ARTICLES: GuideArticle[] = [
  {
    slug: "cost-of-living",
    title: "Cost of living in Da Nang",
    hubLabel: "Cost of living",
    summary:
      "Realistic example prices for food, transport, activities, and monthly budgets — so you can picture day-to-day life.",
    description:
      "Da Nang cost of living guide for expats: restaurant prices, coffee, Grab, surf lessons, gyms, utilities, and monthly budget examples.",
    blocks: [
      {
        type: "intro",
        text: "Da Nang is still one of Vietnam’s more affordable coastal cities for international residents — but “cheap” depends on how you eat, move around, and where you live. Below are typical example prices in USD. Treat them as ballparks; inflation and neighbourhood matter.",
      },
      {
        type: "prices",
        title: "Eating out — local & casual",
        rows: [
          { item: "Cơm / bún / phở at a local spot", price: "$1.50–3", note: "Hearty lunch or dinner" },
          { item: "Bánh mì", price: "$0.80–1.50" },
          { item: "Fresh juice / smoothie", price: "$1–2" },
          { item: "Iced coffee (cà phê sữa đá)", price: "$1–1.50", note: "Street or small café" },
          { item: "Beer at a local quán", price: "$0.80–1.50" },
        ],
        footnote: "Local food is where Da Nang stays genuinely inexpensive.",
      },
      {
        type: "prices",
        title: "Cafés & Western-style dining",
        rows: [
          { item: "Specialty coffee / flat white", price: "$2–3.50", note: "Expat café strips" },
          { item: "Brunch plate / avocado toast set", price: "$6–12" },
          { item: "Burger + fries at a casual spot", price: "$6–10" },
          { item: "Pizza (personal / share)", price: "$7–14" },
          { item: "Mid-range dinner for two", price: "$20–40", note: "Nice but not fancy" },
          { item: "Nice seafood / date-night dinner for two", price: "$40–80+" },
          { item: "Cocktail at a beach bar", price: "$5–9" },
        ],
      },
      {
        type: "prices",
        title: "Groceries & cooking at home",
        rows: [
          { item: "Weekly market shop (1 person, local)", price: "$15–25" },
          { item: "Weekly supermarket mix (import extras)", price: "$30–55" },
          { item: "Imported cheese / specialty items", price: "Premium", note: "Often 2–4× home prices" },
          { item: "Big bottle of water delivery", price: "$0.50–1" },
        ],
        footnote: "Cooking local ingredients keeps costs low; Western pantry staples add up quickly.",
      },
      {
        type: "prices",
        title: "Getting around",
        rows: [
          { item: "GrabBike across town", price: "$1–3" },
          { item: "GrabCar short trip", price: "$3–7" },
          { item: "Motorbike rental (monthly)", price: "$50–90", note: "Depends on bike & season" },
          { item: "Petrol for light weekly use", price: "$15–30 / mo" },
          { item: "Motorbike taxi / xe ôm short hop", price: "$1–2" },
        ],
      },
      {
        type: "prices",
        title: "Beach, sport & fun",
        rows: [
          { item: "Surf lesson (group / intro)", price: "$20–40", note: "My Khe / Son Tra area" },
          { item: "Surfboard rental (half day)", price: "$10–20" },
          { item: "Yoga drop-in class", price: "$8–15" },
          { item: "Gym membership", price: "$20–45 / mo" },
          { item: "Massage (60–90 min)", price: "$8–25", note: "Local → spa range" },
          { item: "Movie ticket", price: "$3–6" },
          { item: "Day trip to Hội An (Grab / bus)", price: "$5–25", note: "Depends on transport" },
        ],
      },
      {
        type: "prices",
        title: "Home & work basics (beyond rent)",
        rows: [
          { item: "Electricity + water (modest AC use)", price: "$25–60 / mo" },
          { item: "Electricity (heavy AC / hot months)", price: "$60–120+ / mo" },
          { item: "Home fibre internet", price: "$10–20 / mo" },
          { item: "Coworking day pass", price: "$8–15" },
          { item: "Coworking monthly desk", price: "$80–180" },
          { item: "Laundry (wash & fold)", price: "$1–2 / kg" },
          { item: "House cleaner (half day)", price: "$10–20" },
        ],
      },
      {
        type: "prices",
        title: "Rough monthly lifestyle budgets (excluding rent)",
        rows: [
          { item: "Lean local lifestyle", price: "$250–400", note: "Mostly Vietnamese food, bike, few extras" },
          { item: "Comfortable expat mix", price: "$450–700", note: "Cafés, some Western meals, activities" },
          { item: "Comfortable + social", price: "$700–1,100+", note: "Regular dining out, sport, coworking" },
        ],
        footnote:
          "Add rent on top — often $300–700 for a comfortable studio/1BR in popular areas. Deposits when starting a lease are usually 1–2 months.",
      },
      {
        type: "tips",
        title: "Quick tips",
        items: [
          "Housing is usually your biggest line item — neighbourhood and finish matter more than city averages.",
          "If you eat local most days and grab Western food a few times a week, costs stay very manageable.",
          "AC use in summer can surprise people on electricity bills — ask about average bills before signing.",
          "Prices above are approximate USD examples for orientation, not quotes.",
        ],
      },
    ],
  },
  {
    slug: "neighbourhoods",
    title: "Best areas to live in Da Nang",
    hubLabel: "Best areas",
    summary:
      "Beach strips, café hubs, city centre, or quieter inland — how the main neighbourhoods feel day to day.",
    description:
      "Guide to Da Nang neighbourhoods for expats: My An, An Thuong, Son Tra, Hai Chau, FPT / Hoa Hai, and who each area suits.",
    blocks: [
      {
        type: "intro",
        text: "Da Nang isn’t one vibe. A few kilometres can change noise levels, café density, beach access, and how “expat” daily life feels. Use this as a short orientation — then dig into each neighbourhood guide for rent ranges and details.",
      },
      {
        type: "paragraph",
        title: "My An & An Thuong",
        text: "The classic first base for remote workers: walkable cafés, Western food, coworking nearby, and an easy rhythm between laptop days and beach evenings. Busier and more international — great if you want community quickly; less ideal if you want quiet Vietnamese neighbourhood life.",
        href: "/areas/DN-A",
        linkLabel: "Open Beach-south / An Thuong guide",
      },
      {
        type: "paragraph",
        title: "Son Tra / beach-north",
        text: "More beach-forward living, longer stretches of sand, and a slightly calmer coastal pace than the densest café strips. Good for people who want mornings near the water and don’t need every amenity on their doorstep.",
        href: "/areas/DN-B",
        linkLabel: "Open Beach-north / Son Tra guide",
      },
      {
        type: "paragraph",
        title: "Hai Chau / city centre",
        text: "Closer to the Han River, markets, and everyday Vietnamese city energy. Less “beach holiday” and more urban. Suits people who like city walks, local food, and being near services — with a tradeoff of less immediate beach lifestyle.",
        href: "/areas/DN-C",
        linkLabel: "Open Hai Chau guide",
      },
      {
        type: "paragraph",
        title: "FPT / Hoa Hai & quieter south",
        text: "More space, newer developments, and a slower pace. Popular for longer stays and families who want value and quieter streets. You’ll rely more on a motorbike or Grab for café/beach trips.",
        href: "/areas/DN-E",
        linkLabel: "Open FPT / Hoa Hai guide",
      },
      {
        type: "list",
        title: "How to choose quickly",
        items: [
          "Want cafés + easy social life? Start with My An / An Thuong.",
          "Want beach mornings first? Look Son Tra / beach corridors.",
          "Want local city life? Consider Hai Chau.",
          "Want space / longer lease / quieter? Look south or inland pockets.",
          "Unsure? Tell us your budget and work-from-home needs — we’ll shortlist.",
        ],
      },
      {
        type: "tips",
        title: "Next step",
        items: [
          "Open each neighbourhood guide for rent snapshots, maps, and what’s nearby.",
          "Visit at the time of day you’ll actually live there — evenings on a café street feel different from a quiet Tuesday morning.",
        ],
      },
    ],
  },
  {
    slug: "visas",
    title: "Visas & staying legally",
    hubLabel: "Visas & stays",
    summary:
      "Practical orientation for short visits and longer stays — plus official places to check what applies to your nationality.",
    description:
      "Practical visa and stay notes for expats in Da Nang: official e-visa links, nationality checks, temporary residence registration, and housing timelines.",
    blocks: [
      {
        type: "intro",
        text: "Visa and residence rules change. This page is practical orientation for housing planning — not immigration advice. Always confirm with official government sources or a trusted visa agent before you rely on any pathway.",
      },
      {
        type: "paragraph",
        title: "Check what you need for your nationality",
        text: "Start on Vietnam’s official e-visa portal. You can apply for an e-visa there, check application status, and follow the government’s current entry rules. Some nationalities also qualify for short visa-exempt stays — that list and the allowed length change over time, so verify on official sites rather than forums.",
        href: "https://evisa.gov.vn",
        linkLabel: "Open the official Vietnam e-visa portal",
        external: true,
      },
      {
        type: "links",
        title: "Official resources worth bookmarking",
        items: [
          {
            label: "Vietnam e-visa portal (apply & check status)",
            href: "https://evisa.gov.vn",
            note: "Immigration Department — use this, not lookalike commercial sites",
            external: true,
          },
          {
            label: "Alternate official e-visa system URL",
            href: "https://evisa.xuatnhapcanh.gov.vn",
            note: "Also used by immigration / border systems",
            external: true,
          },
          {
            label: "Vietnamese Embassy (USA) — e-visa & exemption notes",
            href: "https://vietnamembassy-usa.org/news/2023/10/new-policy-electronic-visa-and-visa-exemption",
            note: "Useful overview of e-visa expansion and unilateral exemptions — still confirm current rules for your passport",
            external: true,
          },
        ],
      },
      {
        type: "tips",
        title: "E-visa tips (practical)",
        items: [
          "Apply only on official .gov.vn portals — third-party “e-visa helper” sites often charge markups and can mishandle applications.",
          "Passport details must match exactly; keep at least ~6 months validity beyond your intended stay where required.",
          "Save your application code and approved e-visa PDF before you travel.",
          "If your nationality has a short visa exemption, still check whether your planned stay is longer than the exempt period.",
        ],
      },
      {
        type: "paragraph",
        title: "Temporary residence registration (almost every stay)",
        text: "Foreigners in Vietnam are generally expected to be registered at their place of stay (temporary residence declaration / khai báo tạm trú). Hotels and many short-stay hosts do this automatically. When you rent an apartment, your landlord or building manager usually registers you with the local ward police — often within about 24 hours of move-in. You’ll typically provide a passport copy, visa/entry proof, and the apartment address. Ask your agent or landlord who handles registration before you arrive with bags.",
      },
      {
        type: "list",
        title: "What to expect when you rent long-term",
        items: [
          "Registration is usually a landlord / agent / building task — confirm it in writing if you can.",
          "Keep soft copies of your passport bio page, visa/e-visa, and entry stamp or arrival record.",
          "If you change apartments, registration usually needs updating at the new address.",
          "Police checks are uncommon in daily life for most expats, but proper registration is still the normal compliance path.",
          "“Registered at an address” is not the same as holding a Temporary Residence Card (TRC).",
        ],
      },
      {
        type: "paragraph",
        title: "Longer stays & Temporary Residence Cards",
        text: "Staying beyond tourist / e-visa style visits usually means a different legal basis — for example work, investment, or family sponsorship — often paired with a Temporary Residence Card (TRC). Pathways, documents, and processing times vary a lot by case. For anything beyond a straightforward tourist entry, talk to a reputable immigration specialist early; don’t assume a series of short entries equals a stable long-lease setup.",
      },
      {
        type: "paragraph",
        title: "Why this matters for housing",
        text: "Your legal stay length affects how long you can sensibly commit to a lease, what deposit structure landlords expect, and how early you should lock a place before arrival. Build flexibility into move-in dates when your paperwork is still in motion.",
      },
      {
        type: "list",
        title: "Common situations people plan around",
        items: [
          "Short stay (weeks to a few months): prioritize flexible or shorter leases; verify what’s actually available for your dates.",
          "Multi-month remote work stay: combine housing search with a clear exit or extension plan, and confirm registration with the landlord.",
          "Longer residency ambitions: speak with a specialist early about work/TRC pathways before signing a long lease.",
          "Border runs / extensions: rules and enforcement change — don’t treat forum anecdotes as policy.",
        ],
      },
      {
        type: "tips",
        title: "Practical checklist",
        items: [
          "Confirm your intended length of stay before signing anything long.",
          "Ask landlords/agents what documents they need from foreigners and who files temporary residence registration.",
          "Keep digital and paper copies of passport, e-visa/entry proof, and any registration confirmation you receive.",
          "If someone guarantees a visa “package” bundled with housing, get details in writing and verify independently.",
          "We can help with apartments either way — immigration strategy should sit with a proper advisor.",
        ],
      },
      {
        type: "paragraph",
        text: "When you’re ready on dates and budget, we can match you with verified apartments that fit how long you want to stay — whether that’s a few months or longer.",
      },
    ],
  },
  {
    slug: "remote-work",
    title: "Internet, cafés & coworking",
    hubLabel: "Work & wifi",
    summary:
      "How workable Da Nang is for remote jobs: home fibre, café wifi reality, and when coworking is worth it.",
    description:
      "Remote work in Da Nang: home internet, café wifi, coworking costs, and apartment tips for reliable Zoom days.",
    blocks: [
      {
        type: "intro",
        text: "Da Nang is genuinely friendly to remote work — especially in the main expat neighbourhoods. The difference between a smooth setup and a frustrating one is usually home internet quality, backup options, and whether your apartment is quiet enough for calls.",
      },
      {
        type: "prices",
        title: "Typical work-setup costs",
        rows: [
          { item: "Home fibre (monthly)", price: "$10–20", note: "Widely available in expat areas" },
          { item: "4G/5G backup SIM data", price: "$5–15 / mo" },
          { item: "Coworking day pass", price: "$8–15" },
          { item: "Coworking monthly hot desk", price: "$80–180" },
          { item: "Café laptop session (drink)", price: "$2–5" },
        ],
      },
      {
        type: "list",
        title: "Café wifi vs home vs coworking",
        items: [
          "Home fibre: best default for daily meetings — ask the agent/landlord what speed is installed and average reliability.",
          "Cafés: great for variety and community; wifi quality varies a lot. Fine for async work; riskier for back-to-back calls.",
          "Coworking: worth it if you need meeting rooms, stable uptime, printing, or a clearer work/life split.",
          "Backup plan: a local eSIM/data SIM has saved many Zoom days when the building fibre blips.",
        ],
      },
      {
        type: "tips",
        title: "Apartment tips for remote workers",
        items: [
          "Tell us if you need a quiet desk space, strong AC in the work corner, and fibre already on.",
          "Street-facing units on busy café roads can be lively — great vibe, worse for calls.",
          "Higher floors or courtyard-facing rooms are often calmer for meetings.",
          "Test speed after move-in and keep the ISP contact handy; English support varies.",
        ],
      },
      {
        type: "paragraph",
        title: "Where people usually base",
        text: "My An / An Thuong remain the easiest for café density and coworking access. Beach corridors can work beautifully with a solid home setup. Quieter southern areas are fine for focused work if you’re happy commuting for social/café days.",
      },
      {
        type: "paragraph",
        title: "Browse the coworking registry",
        text: "We’re keeping a live, database-backed list of coworking patterns and desk options around the city — prices and neighbourhood notes included.",
        href: "/moving-guide/coworking",
        linkLabel: "Open the coworking registry",
      },
    ],
  },
  {
    slug: "daily-life",
    title: "Daily life in Da Nang",
    hubLabel: "Daily life",
    summary:
      "How weeks actually feel — beach mornings, café work days, example day tours, weekend escapes, and the small logistics of settling in.",
    description:
      "Daily life in Da Nang for expats: example day tours with photos, beach routines, Hội An trips, Son Tra loops, markets, and settling-in tips.",
    blocks: [
      {
        type: "intro",
        text: "Da Nang’s charm isn’t a checklist of attractions — it’s the rhythm. Warm mornings, cheap good food, beach access, and weekend trips that don’t need a big plan. Below are example days you can actually copy, plus the practical bits that make living here easy.",
      },
      {
        type: "figure",
        src: "/danang-my-khe.jpg",
        alt: "My Khe beach in Da Nang at soft light",
        caption: "My Khe — sunrise and late afternoon are the sweet spots.",
      },
      {
        type: "paragraph",
        title: "A weekday that works for most people",
        text: "Swim or walk early while it’s cooler → work block at home or a café → local lunch for a few dollars → another work block → beach walk, gym, or yoga → dinner somewhere simple. Evenings on the café strips are social; a few streets inland stay quieter. Your exact block matters more than the city average — that’s why neighbourhood fit is half the lifestyle.",
      },
      {
        type: "tour",
        title: "Beach morning + laptop afternoon",
        tagline: "The classic remote-worker day without leaving the coast.",
        image: {
          src: "/danang-my-khe-hotels.jpg",
          alt: "Beach corridor hotels and shoreline in Da Nang",
        },
        duration: "Half day → full day",
        cost: "~$8–20",
        steps: [
          "Sunrise walk or swim at My Khe / Son Tra beach (bring flip-flops, leave valuables light).",
          "Cà phê sữa đá or a flat white nearby — sit outside before it gets hot.",
          "Work block at home fibre, or hop a café if you want background energy.",
          "Late lunch: bún / cơm / bánh mì for a few dollars, or a Western bowl if you need a treat.",
          "Golden-hour beach loop again — this is when Da Nang feels most “why we live here.”",
        ],
        tip: "For Zoom-heavy days, do the beach first and protect a quiet apartment desk after.",
        href: "/areas/DN-B",
        linkLabel: "Beach-north neighbourhood guide",
      },
      {
        type: "tour",
        title: "Son Tra scooter loop",
        tagline: "Views, quieter roads, and a reset when the city feels loud.",
        image: {
          src: "/danang-hero-bg.jpg",
          alt: "Da Nang coastline and hills at golden hour",
        },
        duration: "2–4 hours",
        cost: "~$5–15 (mostly fuel if you already have a bike)",
        steps: [
          "Start mid-morning or late afternoon — midday heat on the peninsula is real.",
          "Ride the Son Tra loop for viewpoints; keep snacks sealed (monkeys are opportunistic).",
          "Stop for a cold drink with a view; don’t rush every overlook.",
          "Drop back toward the beach corridor for a swim or seafood dinner.",
        ],
        tip: "If you’re new to Vietnamese traffic, go with a friend first or take Grab up and walk short stretches.",
        href: "/moving-guide/activities",
        linkLabel: "More outdoor ideas in the activity registry",
      },
      {
        type: "tour",
        title: "Hội An day trip",
        tagline: "Lantern streets, slower pace, excellent food — still home for dinner if you want.",
        image: {
          src: "/danang-hands.jpg",
          alt: "Hands and everyday life details in central Vietnam",
        },
        duration: "Full day (or overnight)",
        cost: "~$25–60 pp depending on transport + meals",
        steps: [
          "Leave Da Nang mid-morning by Grab, bus, or private driver (~45 minutes).",
          "Wander the old town before peak lantern crowds — coffee, tailors, river paths.",
          "Long lunch: cao lầu, trắng bánh, or a riverside seafood spot.",
          "Stay for lantern hour if you like atmosphere, or head back before the latest traffic.",
          "Optional overnight if you want a slower weekend without rushing the light.",
        ],
        tip: "Weekdays are calmer than weekends; bring a light layer for evening river breezes.",
        href: "/moving-guide/activities",
        linkLabel: "See day-trip entries in the registry",
      },
      {
        type: "tour",
        title: "City evening — river & Dragon Bridge",
        tagline: "When you want urban energy instead of sand.",
        image: {
          src: "/danang-dragon-bridge.jpeg",
          alt: "Dragon Bridge in Da Nang lit at night",
        },
        duration: "Evening",
        cost: "~$10–30 pp",
        steps: [
          "Grab into Hai Chau / the Han River area before sunset.",
          "Walk the riverfront, people-watch, and snack your way through street stalls.",
          "Catch Dragon Bridge show nights if the schedule lines up (weekends are the usual bet — confirm locally).",
          "Dinner nearby — from plastic-stool local to nicer riverside.",
          "Easy Grab home; no need to drive if you’ve been celebrating.",
        ],
        tip: "Pair this with a quieter beach base so you get both rhythms in one week.",
        href: "/areas/DN-C",
        linkLabel: "Hai Chau neighbourhood guide",
      },
      {
        type: "tour",
        title: "Market morning + home cooking",
        tagline: "The cheapest, most local way to feel settled.",
        image: {
          src: "/danang-market-morning.jpg",
          alt: "Fresh leafy greens at a Vietnamese morning market stall",
          credit: "Photo: Takeaway / Wikimedia Commons (CC BY-SA 3.0)",
        },
        duration: "2–3 hours",
        cost: "~$5–15 for a solid haul",
        steps: [
          "Go early — markets are cooler and the good herbs go first.",
          "Point, smile, and learn a few numbers; scales and small bags appear quickly.",
          "Grab fruit, greens, eggs, tofu, and something ready-to-eat for breakfast.",
          "Home for coffee and a simple cook — this is how monthly costs stay low.",
        ],
        tip: "Keep a small stash of imported comfort items from the supermarket; don’t try to replace everything on day one.",
        href: "/moving-guide/cost-of-living",
        linkLabel: "See grocery & food price examples",
      },
      {
        type: "prices",
        title: "Everyday “nice to know” prices",
        rows: [
          { item: "Market fruit / veg haul", price: "$3–8" },
          { item: "Street dinner for one", price: "$2–4" },
          { item: "Gym drop-in or day", price: "$3–8" },
          { item: "Surf lesson", price: "$20–40" },
          { item: "Yoga drop-in", price: "$8–15" },
          { item: "Haircut (local → expat salon)", price: "$5–20+" },
          { item: "Massage (60–90 min)", price: "$8–25" },
        ],
        footnote: "More activity ideas with prices live in the activity registry.",
      },
      {
        type: "list",
        title: "Settling-in logistics",
        items: [
          "Grab and Google Maps cover most trips; a rented motorbike unlocks the real city.",
          "ATMs and cards are widely usable — still keep some cash for markets and small vendors.",
          "Delivery apps handle food and groceries in denser neighbourhoods.",
          "Build a small home kit early: adapters, mosquito plan, laundry routine, water delivery.",
          "Ask your landlord who handles temporary residence registration when you move in.",
        ],
      },
      {
        type: "tips",
        title: "Make the apartment match the life you want",
        items: [
          "Beach walks non-negotiable? Optimise for that — not the loudest café street.",
          "Late international calls? Prioritise quiet and reliable fibre.",
          "Family / longer stay? Look earlier at space, elevators, and quieter southern or inland streets.",
          "We shortlist homes around how you want weeks to feel — not just a rent number.",
        ],
      },
      {
        type: "paragraph",
        title: "Keep exploring",
        text: "The activity registry is where we keep adding surf, wellness, food, and day-trip options with ballpark prices. Pair it with neighbourhood guides when you’re choosing where to live.",
        href: "/moving-guide/activities",
        linkLabel: "Open the activity registry",
      },
    ],
  },
];

export function getGuideArticle(slug: string): GuideArticle | undefined {
  return GUIDE_ARTICLES.find((a) => a.slug === slug);
}

export function getAllGuideSlugs(): string[] {
  return GUIDE_ARTICLES.map((a) => a.slug);
}

/** Hub / homepage order — Daily life featured first */
export function getGuideArticlesForHub(): GuideArticle[] {
  const featured = GUIDE_ARTICLES.find((a) => a.slug === "daily-life");
  if (!featured) return GUIDE_ARTICLES;
  return [featured, ...GUIDE_ARTICLES.filter((a) => a.slug !== "daily-life")];
}
