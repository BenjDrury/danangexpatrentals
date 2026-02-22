import Image from "next/image";
import { CONTENT_CONTAINER, SECTION_PADDING } from "@/app/lib/constants";

type SectionWithImageProps = {
  /** Background class (e.g. "bg-white", "bg-slate-50") */
  bg: string;
  /** Image source (e.g. "/danang-my-khe.jpg") */
  imageSrc: string;
  imageAlt: string;
  /** Which side the image sits on */
  imageSide: "left" | "right";
  /** Main content (heading, text, etc.) */
  children: React.ReactNode;
};

/**
 * Section with a large image on one side and content on the other. Use for general page atmosphere.
 */
export function SectionWithImage({
  bg,
  imageSrc,
  imageAlt,
  imageSide,
  children,
}: SectionWithImageProps) {
  const imageBlock = (
    <div className="relative aspect-[4/3] overflow-hidden rounded-2xl shadow-lg sm:aspect-[3/2]">
      <Image
        src={imageSrc}
        alt={imageAlt}
        fill
        className="object-cover"
        sizes="(max-width: 768px) 100vw, 50vw"
      />
    </div>
  );

  return (
    <section className={`w-full ${SECTION_PADDING} ${bg}`}>
      <div className={CONTENT_CONTAINER}>
        <div
          className={`grid gap-10 lg:grid-cols-2 lg:gap-14 lg:items-center ${
            imageSide === "right" ? "" : ""
          }`}
        >
          {imageSide === "left" && imageBlock}
          <div className={imageSide === "left" ? "lg:order-2" : ""}>
            {children}
          </div>
          {imageSide === "right" && imageBlock}
        </div>
      </div>
    </section>
  );
}
