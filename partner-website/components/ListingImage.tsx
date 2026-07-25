"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";

type Props = Omit<ImageProps, "src"> & {
  src: string | null | undefined;
};

/**
 * Listing photo with soft fallback when URL fails (missing file, blocked CDN, etc.).
 */
export function ListingImage({ src, alt, className, fill, width, height, sizes, ...rest }: Props) {
  const value = src?.trim() || null;
  const [failed, setFailed] = useState(false);

  if (!value || failed) {
    return (
      <div
        className={`flex items-center justify-center bg-sand text-xs text-muted ${className ?? ""}`}
        style={fill ? { position: "absolute", inset: 0 } : undefined}
        aria-hidden
      />
    );
  }

  return (
    <Image
      src={value}
      alt={alt}
      className={className}
      fill={fill}
      width={fill ? undefined : width}
      height={fill ? undefined : height}
      sizes={sizes}
      onError={() => setFailed(true)}
      {...rest}
    />
  );
}
