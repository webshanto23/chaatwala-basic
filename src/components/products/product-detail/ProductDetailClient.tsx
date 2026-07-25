"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useCart } from "@/features/cart/context";
import Link from "next/link";

type Product = {
  type: "dish" | "drink" | "combo";
  data: {
    id: string;
    name: string;
    price: number;
    discountPrice: number | null;
    description: string | null;
    imageUrl: string | null;
  };
};

export default function ProductDetailClient({ product }: { product: Product }) {
  const { addItem } = useCart();

  const { data, type } = product;
  const imageUrl = data.imageUrl || "/images/chatwala_logo.png";
  const price = data.discountPrice ?? data.price;
  const description = data.description || "No description available.";

  const categoryHref =
    type === "dish"
      ? "/products/dishes"
      : type === "drink"
        ? "/products/drinks"
        : "/products/combos";

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <Button asChild variant="ghost" className="mb-6">
        <Link href={categoryHref}>← Back to menu</Link>
      </Button>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="aspect-square overflow-hidden rounded-[2rem] bg-muted/30">
          <Image
            src={imageUrl}
            alt={data.name}
            width={600}
            height={600}
            className="h-full w-full object-cover"
          />
        </div>

        <div className="flex flex-col justify-center space-y-4">
          <h1 className="text-3xl font-bold text-foreground">{data.name}</h1>
          <p className="text-2xl font-semibold text-primary">
            ৳{price.toFixed(2)}
          </p>
          <p className="text-muted-foreground">{description}</p>

          <Button
            className="mt-4 w-full rounded-full bg-primary text-primary-foreground hover:bg-primary/90 md:w-auto"
            onClick={() =>
              addItem({ productId: data.id, productType: type, quantity: 1 })
            }
          >
            Add to Cart
          </Button>
        </div>
      </div>
    </div>
  );
}
