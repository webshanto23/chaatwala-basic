export const revalidate = 300;

import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import ProductDetailClient from "@/components/products/product-detail/ProductDetailClient";
import { getRelatedProducts } from "@/features/products/service";

type ProductData = {
  id: string;
  name: string;
  type: "dish" | "drink" | "combo";
  price: number;
  discountPrice: number | null;
  originalPrice: number | null;
  description: string | null;
  isAvailable: boolean;
  imageUrl: string | null;
  tag: string | null;
  storeId: string | null;
  items: string[] | null;
};

async function getProduct(id: string): Promise<ProductData | null> {
  const [dish, drink, combo] = await Promise.all([
    prisma.dish.findUnique({
      where: { id },
      select: { id: true, name: true, price: true, discountPrice: true, description: true, isAvailable: true, imageUrl: true, tag: true, storeId: true },
    }),
    prisma.drink.findUnique({
      where: { id },
      select: { id: true, name: true, price: true, discountPrice: true, description: true, isAvailable: true, imageUrl: true, tag: true, storeId: true },
    }),
    prisma.combo.findUnique({
      where: { id },
      select: { id: true, name: true, price: true, originalPrice: true, isAvailable: true, imageUrl: true, items: true, storeId: true },
    }),
  ]);

  if (dish) {
    return {
      id: dish.id,
      name: dish.name,
      type: "dish",
      price: Number(dish.price),
      discountPrice: dish.discountPrice ? Number(dish.discountPrice) : null,
      originalPrice: null,
      description: dish.description,
      isAvailable: dish.isAvailable,
      imageUrl: dish.imageUrl,
      tag: dish.tag,
      storeId: dish.storeId,
      items: null,
    };
  }
  if (drink) {
    return {
      id: drink.id,
      name: drink.name,
      type: "drink",
      price: Number(drink.price),
      discountPrice: drink.discountPrice ? Number(drink.discountPrice) : null,
      originalPrice: null,
      description: drink.description,
      isAvailable: drink.isAvailable,
      imageUrl: drink.imageUrl,
      tag: drink.tag,
      storeId: drink.storeId,
      items: null,
    };
  }
  if (combo) {
    return {
      id: combo.id,
      name: combo.name,
      type: "combo",
      price: Number(combo.price),
      discountPrice: Number(combo.originalPrice),
      originalPrice: Number(combo.originalPrice),
      description: null,
      isAvailable: combo.isAvailable,
      imageUrl: combo.imageUrl,
      tag: null,
      storeId: combo.storeId,
      items: combo.items,
    };
  }
  return null;
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

  const imageUrl = product.imageUrl || "/images/chatwala_logo.png";

  const [store, related] = await Promise.all([
    product.storeId
      ? prisma.store.findUnique({ where: { id: product.storeId }, select: { id: true, name: true } })
      : Promise.resolve(null),
    getRelatedProducts(product.type, product.id),
  ]);

  const storeName = store?.name ?? null;
  const relatedProducts = related.map((item) => ({
    id: item.id,
    name: item.name,
    price: Number(item.price),
    discountPrice: "discountPrice" in item ? (item.discountPrice ? Number(item.discountPrice) : null) : null,
    originalPrice: "originalPrice" in item ? Number(item.originalPrice) : null,
    imageUrl: item.imageUrl,
    tag: "tag" in item ? item.tag : null,
    items: "items" in item ? item.items : null,
  }));

  const price = product.discountPrice ?? product.price;
  const originalPrice = product.originalPrice ?? product.price;
  const hasDiscount = originalPrice > price;
  const savingsPercent = hasDiscount ? Math.round(((originalPrice - price) / originalPrice) * 100) : null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: imageUrl.startsWith("http") ? imageUrl : `https://chaatwala-basic.vercel.app${imageUrl}`,
    offers: {
      "@type": "Offer",
      price: price,
      priceCurrency: "BDT",
      availability: product.isAvailable
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
      <ProductDetailClient
        product={product}
        storeName={storeName}
        relatedProducts={relatedProducts}
        hasDiscount={hasDiscount}
        savingsPercent={savingsPercent}
        originalPrice={originalPrice}
      />
    </>
  );
}
