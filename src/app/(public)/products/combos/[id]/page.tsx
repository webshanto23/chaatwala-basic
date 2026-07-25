export const revalidate = 300;

import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import ProductDetailClient from "@/components/products/product-detail/ProductDetailClient";

async function getProduct(id: string) {
  const [dish, drink, combo] = await Promise.all([
    prisma.dish.findUnique({ where: { id } }),
    prisma.drink.findUnique({ where: { id } }),
    prisma.combo.findUnique({ where: { id } }),
  ]);

  if (dish) return { type: "dish" as const, data: dish };
  if (drink) return { type: "drink" as const, data: drink };
  if (combo) return { type: "combo" as const, data: combo };
  return null;
}

function serialize(product: any) {
  return {
    type: product.type,
    data: {
      id: product.data.id,
      name: product.data.name,
      price: Number(product.data.price),
      discountPrice: product.data.discountPrice ? Number(product.data.discountPrice) : null,
      description: product.data.description,
      imageUrl: product.data.imageUrl,
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

  return <ProductDetailClient product={serialize(product)} />;
}
