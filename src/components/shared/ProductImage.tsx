"use client";

import Image from "next/image";

type ProductImageProps = React.ComponentProps<typeof Image>;

export function ProductImage({ src, alt, ...rest }: ProductImageProps) {
  if (typeof src === "string" && src.startsWith("http")) {
    return <img src={src} alt={alt} {...rest} /> as unknown as React.ReactElement;
  }

  return <Image src={src} alt={alt} {...rest} />;
}
