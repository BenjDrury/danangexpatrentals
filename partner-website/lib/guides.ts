export type PartnerGuideLink = {
  title: string;
  titleVi: string;
  description: string;
  descriptionVi: string;
  path: string;
};

/** Shareable living-guide links partners can send to clients. */
export const PARTNER_GUIDE_LINKS: PartnerGuideLink[] = [
  {
    title: "Living in Da Nang (hub)",
    titleVi: "Sống ở Đà Nẵng (trang chính)",
    description: "Start here — practical guide for international residents.",
    descriptionVi: "Bắt đầu từ đây — hướng dẫn thực tế cho khách quốc tế.",
    path: "/moving-guide",
  },
  {
    title: "Daily life",
    titleVi: "Cuộc sống hàng ngày",
    description: "A coastal day-in-the-life tour with local tips.",
    descriptionVi: "Một ngày ven biển kèm mẹo địa phương.",
    path: "/moving-guide/daily-life",
  },
  {
    title: "Cost of living",
    titleVi: "Chi phí sinh hoạt",
    description: "Food, transport, utilities — realistic USD ballparks.",
    descriptionVi: "Ăn uống, đi lại, tiện ích — mức USD thực tế.",
    path: "/moving-guide/cost-of-living",
  },
  {
    title: "Neighbourhoods",
    titleVi: "Các khu vực",
    description: "Where to live and what each area feels like.",
    descriptionVi: "Nên ở đâu và trải nghiệm ở từng khu vực.",
    path: "/moving-guide/neighbourhoods",
  },
  {
    title: "Visas",
    titleVi: "Visa",
    description: "High-level visa notes for longer stays.",
    descriptionVi: "Ghi chú visa tổng quan cho lưu trú dài hạn.",
    path: "/moving-guide/visas",
  },
  {
    title: "Remote work",
    titleVi: "Làm việc từ xa",
    description: "Coworking, cafés, and working from Da Nang.",
    descriptionVi: "Coworking, quán cà phê và làm việc từ Đà Nẵng.",
    path: "/moving-guide/remote-work",
  },
  {
    title: "Coworking registry",
    titleVi: "Danh sách coworking",
    description: "Live list of coworking spots with day-pass notes.",
    descriptionVi: "Danh sách coworking cập nhật kèm ghi chú day pass.",
    path: "/moving-guide/coworking",
  },
  {
    title: "Activities",
    titleVi: "Hoạt động",
    description: "Surf, wellness, day trips — things to do nearby.",
    descriptionVi: "Lướt sóng, wellness, tour trong ngày — các hoạt động gần bạn.",
    path: "/moving-guide/activities",
  },
  {
    title: "How it works",
    titleVi: "Cách chúng tôi làm việc",
    description: "How Da Nang Expat Rentals helps renters find a place.",
    descriptionVi: "Cách Da Nang Expat Rentals giúp người thuê tìm chỗ.",
    path: "/how-it-works",
  },
  {
    title: "Avoid scams",
    titleVi: "Tránh lừa đảo",
    description: "Trust signals and red flags for apartment hunting.",
    descriptionVi: "Dấu hiệu tin cậy và điểm đáng lưu ý khi tìm căn hộ.",
    path: "/avoid-scams",
  },
];

/** Guides most useful to share alongside a specific listing. */
export const LISTING_RELEVANT_GUIDE_PATHS = [
  "/moving-guide/neighbourhoods",
  "/moving-guide/cost-of-living",
  "/avoid-scams",
  "/moving-guide",
] as const;

export function getListingRelevantGuides(): PartnerGuideLink[] {
  const byPath = new Map(PARTNER_GUIDE_LINKS.map((g) => [g.path, g]));
  return LISTING_RELEVANT_GUIDE_PATHS.map((path) => byPath.get(path)).filter(
    (g): g is PartnerGuideLink => Boolean(g)
  );
}
