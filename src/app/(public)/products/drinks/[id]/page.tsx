export const revalidate = 300;

import { notFound } from "next/navigation";
import ProductDetailClient from "@/components/products/product-detail/ProductDetailClient";
import { getProductById } from "@/features/products/service";

async function getProduct(id: string) {
  const product = await getProductById(id);
  if (!product) {
    return null;
  }
  if (product.type === "combo") {
    return {
      type: product.type,
      data: {
        ...product.data,
        price: Number(product.data.price),
        discountPrice: Number(product.data.originalPrice),
        originalPrice: Number(product.data.originalPrice),
        description: null,
      },
    };
  }
  return {
    type: product.type as "dish" | "drink",
    data: {
      ...product.data,
      price: Number(product.data.price),
      discountPrice: product.data.discountPrice ? Number(product.data.discountPrice) : null,
    },
  };
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
  const { data } = serialized;
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
