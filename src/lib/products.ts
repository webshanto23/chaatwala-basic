import prisma from "@/lib/prisma";
import type { ProductType } from "@/features/cart/types";

export interface ProductInfo {
  id: string;
  name: string;
  price: number;
  discountPrice: number | null;
  imageUrl: string | null;
}

export async function findProduct(productType: ProductType, productId: string): Promise<ProductInfo | null> {
  if (productType === "dish") {
    const dish = await prisma.dish.findUnique({
      where: { id: productId },
      select: { id: true, name: true, price: true, discountPrice: true, imageUrl: true },
    });
    if (!dish) return null;
    return {
      id: dish.id,
      name: dish.name,
      price: Number(dish.price),
      discountPrice: dish.discountPrice ? Number(dish.discountPrice) : null,
      imageUrl: dish.imageUrl,
    };
  }
  if (productType === "drink") {
    const drink = await prisma.drink.findUnique({
      where: { id: productId },
      select: { id: true, name: true, price: true, discountPrice: true, imageUrl: true },
    });
    if (!drink) return null;
    return {
      id: drink.id,
      name: drink.name,
      price: Number(drink.price),
      discountPrice: drink.discountPrice ? Number(drink.discountPrice) : null,
      imageUrl: drink.imageUrl,
    };
  }
  if (productType === "combo") {
    const combo = await prisma.combo.findUnique({
      where: { id: productId },
      select: { id: true, name: true, price: true, imageUrl: true },
    });
    if (!combo) return null;
    return {
      id: combo.id,
      name: combo.name,
      price: Number(combo.price),
      discountPrice: null,
      imageUrl: combo.imageUrl,
    };
  }
  return null;
}

export function getEffectivePrice(product: ProductInfo): number {
  return product.discountPrice ?? product.price;
}
