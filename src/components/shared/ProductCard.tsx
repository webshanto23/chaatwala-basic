"use client";

import { ProductCardContent } from "@/components/shared/ProductCardContent";
import { ProductCardActions } from "@/components/shared/ProductCardActions";

type ProductTag = "spicy" | "popular" | "new";

type ProductCardProps = {
  id: string;
  image: string;
  name: string;
  price: number | string;
  originalPrice?: number;
  discountPrice?: number | null;
  detail?: string;
  rating?: number;
  tag?: ProductTag;
  customBadge?: string;
  productType: "food";
  className?: string;
  href?: string;
};

export function ProductCard({
  id,
  image,
  name,
  price,
  originalPrice,
  discountPrice,
  detail,
  rating,
  tag,
  customBadge,
  productType,
  className,
  href,
}: ProductCardProps) {
  return (
    <div
      className={`shrink-0 w-56 rounded-[2rem] border border-border/70 shadow-xl shadow-primary/10 transition-all duration-200 hover:-translate-y-1 hover:shadow-2xl snap-start group ${
        className ?? ""
      }`}
    >
      <ProductCardContent
        image={image}
        name={name}
        price={price}
        originalPrice={originalPrice}
        discountPrice={discountPrice}
        detail={detail}
        rating={rating}
        tag={tag}
        customBadge={customBadge}
        href={href}
      />
      <div className="space-y-3 p-5">
        <ProductCardActions id={id} productType={productType} />
      </div>
    </div>
  );
}
