"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Minus } from "lucide-react";
import { useState } from "react";
import Image from "next/image";
import { useCart } from "@/features/cart/context";

type ProductTag = "spicy" | "popular" | "new";

type ProductCardProps = {
  id: string;
  image: string;
  name: string;
  price: number | string;
  detail?: string;
  rating?: number;
  tag?: ProductTag;
  customBadge?: string;
  productType: "dish" | "drink";
  className?: string;
};

export function ProductCard({
  id,
  image,
  name,
  price,
  detail,
  rating,
  tag,
  customBadge,
  productType,
  className,
}: ProductCardProps) {
  const [quantity, setQuantity] = useState(0);
  const { addItem } = useCart();

  return (
    <div
      className={`shrink-0 w-56 rounded-[2rem] border border-border/70 bg-linear-to-br from-card to-primary/5 shadow-xl shadow-primary/10 transition-all duration-200 hover:-translate-y-1 hover:shadow-2xl snap-start group ${
        className ?? ""
      }`}
    >
      <div className="relative overflow-hidden rounded-[2rem] bg-muted/30">
        <div className="aspect-square w-full overflow-hidden">
          <Image
            src={image}
            alt={name}
            width={224}
            height={224}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        </div>

        {tag && (
          <Badge
            variant={tag}
            className="absolute top-3 right-3 rounded-full px-4 py-2 text-xs shadow-lg"
          >
            {tag === "spicy"
              ? "Spicy"
              : tag === "popular"
                ? "Popular"
                : "New"}
          </Badge>
        )}

        {customBadge ? (
          <div className="absolute bottom-3 left-3 rounded-full bg-background/90 px-3 py-1 text-xs font-semibold text-foreground shadow-sm">
            {customBadge}
          </div>
        ) : rating !== undefined ? (
          <div className="absolute bottom-3 left-3 rounded-full bg-background/90 px-3 py-1 text-xs font-semibold text-foreground shadow-sm">
            ⭐ {rating}
          </div>
        ) : null}
      </div>

      <div className="space-y-3 p-5">
        {detail ? (
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-foreground line-clamp-1">
              {name}
            </h3>
            <p className="text-xs text-muted-foreground">{detail}</p>
          </div>
        ) : (
          <h3 className="text-sm font-semibold text-foreground line-clamp-1">
            {name}
          </h3>
        )}

        <p className="text-lg font-bold text-primary">৳{price}</p>

        {quantity === 0 ? (
          <Button
            size="sm"
            className="w-full rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => {
              setQuantity(1);
              addItem({ productId: id, productType, quantity: 1 });
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add
          </Button>
        ) : (
          <div className="flex items-center justify-between gap-2 rounded-full border border-border/70 bg-background/90 p-2">
            <Button
              size="sm"
              variant="outline"
              className="h-9 w-9 rounded-full p-0"
              onClick={() => {
                const next = Math.max(0, quantity - 1);
                setQuantity(next);
              }}
            >
              <Minus className="h-3 w-3" />
            </Button>

            <span className="font-medium text-sm">{quantity}</span>

            <Button
              size="sm"
              className="h-9 w-9 rounded-full p-0 bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => {
                setQuantity((prev) => prev + 1);
                addItem({ productId: id, productType, quantity: 1 });
              }}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
