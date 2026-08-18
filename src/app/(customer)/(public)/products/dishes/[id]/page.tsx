export const revalidate = 300;

import { notFound } from "next/navigation";
import ProductDetailClient from "@/components/products/product-detail/ProductDetailClient";
import { getProductById, getRelatedProducts } from "@/features/products/service";
import prisma from "@/lib/prisma";

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
  const product = await getProductById(id);
  if (!product) return null;

  if (product.type === "combo") {
    return {
      id: product.data.id,
      name: product.data.name,
      type: "combo",
      price: Number(product.data.price),
      discountPrice: Number(product.data.originalPrice),
      originalPrice: Number(product.data.originalPrice),
      description: null,
      isAvailable: product.data.isAvailable,
      imageUrl: product.data.imageUrl,
      tag: null,
      storeId: product.data.storeId ?? null,
      items: product.data.items ?? null,
    };
  }

  return {
    id: product.data.id,
    name: product.data.name,
    type: product.type,
    price: Number(product.data.price),
    discountPrice: product.data.discountPrice ? Number(product.data.discountPrice) : null,
    originalPrice: null,
    description: product.data.description,
    isAvailable: product.data.isAvailable,
    imageUrl: product.data.imageUrl,
    tag: product.data.tag ?? null,
    storeId: product.data.storeId ?? null,
    items: null,
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
