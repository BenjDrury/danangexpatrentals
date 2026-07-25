import Image from "next/image";
import { CONTENT_CONTAINER, SECTION_PADDING } from "@/app/lib/constants";

type SectionWithImageProps = {
  bg: string;
  imageSrc: string;
  imageAlt: string;
  imageSide: "left" | "right";
  children: React.ReactNode;
};

export function SectionWithImage({
  bg,
  imageSrc,
  imageAlt,
  imageSide,
  children,
}: SectionWithImageProps) {
  const imageBlock = (
    <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-sand sm:aspect-[5/4]">
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
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {imageSide === "left" && imageBlock}
          <div className={imageSide === "left" ? "lg:order-2" : ""}>{children}</div>
          {imageSide === "right" && imageBlock}
        </div>
      </div>
    </section>
  );
}
