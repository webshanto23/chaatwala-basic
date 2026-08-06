export const revalidate = 300;

import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import ProductDetailClient from "@/components/products/product-detail/ProductDetailClient";

async function getProduct(id: string) {
  const [dish, drink, combo] = await Promise.all([
    prisma.dish.findUnique({
      where: { id },
      select: { id: true, name: true, price: true, discountPrice: true, description: true, isAvailable: true, imageUrl: true },
    }),
    prisma.drink.findUnique({
      where: { id },
      select: { id: true, name: true, price: true, discountPrice: true, description: true, isAvailable: true, imageUrl: true },
    }),
    prisma.combo.findUnique({
      where: { id },
      select: { id: true, name: true, price: true, originalPrice: true, isAvailable: true, imageUrl: true },
    }),
  ]);

  if (dish) return { type: "dish" as const, data: { ...dish, price: Number(dish.price), discountPrice: dish.discountPrice ? Number(dish.discountPrice) : null } };
  if (drink) return { type: "drink" as const, data: { ...drink, price: Number(drink.price), discountPrice: drink.discountPrice ? Number(drink.discountPrice) : null } };
  if (combo) return { type: "combo" as const, data: { ...combo, price: Number(combo.price), originalPrice: Number(combo.originalPrice) } };
  return null;
}

type ProductResult =
  | { type: "dish"; data: { id: string; name: string; price: number; discountPrice: number | null; description: string | null; isAvailable: boolean; imageUrl: string | null } }
  | { type: "drink"; data: { id: string; name: string; price: number; discountPrice: number | null; description: string | null; isAvailable: boolean; imageUrl: string | null } }
  | { type: "combo"; data: { id: string; name: string; price: number; originalPrice: number; isAvailable: boolean; imageUrl: string | null } };

function serialize(product: ProductResult) {
  const base = {
    id: product.data.id,
    name: product.data.name,
    price: Number(product.data.price),
    isAvailable: product.data.isAvailable,
    imageUrl: product.data.imageUrl,
  };

  if (product.type === "combo") {
    return {
      type: product.type,
      data: {
        ...base,
        discountPrice: Number(product.data.originalPrice),
        description: null,
      },
    };
  }

  return {
    type: product.type,
    data: {
      ...base,
      discountPrice: product.data.discountPrice ? Number(product.data.discountPrice) : null,
      description: product.data.description,
    },
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    notFound();
  }

  const serialized = serialize(product);
  const { data, type } = serialized;
  const imageUrl = data.imageUrl || "/images/chatwala_logo.png";
  const price = data.discountPrice ?? data.price;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: data.name,
    image: imageUrl.startsWith("http") ? imageUrl : `https://chaatwala-basic.vercel.app${imageUrl}`,
    offers: {
      "@type": "Offer",
      price: price,
      priceCurrency: "BDT",
      availability: data.isAvailable
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductDetailClient product={serialized} />
    </>
  );
}
