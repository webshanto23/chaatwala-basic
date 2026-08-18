import prisma from "@/lib/prisma";
import { unstable_cache } from "next/cache";

export async function getPopularDishes() {
  return unstable_cache(
    async () => {
      return prisma.dish.findMany({
        where: { tag: "popular", isAvailable: true },
        select: { id: true, name: true, price: true, discountPrice: true, imageUrl: true, description: true, tag: true },
      });
    },
    ["public-popular-dishes"],
    { revalidate: 300, tags: ["dishes"] }
  )();
}

export async function getPopularDrinks() {
  return unstable_cache(
    async () => {
      return prisma.drink.findMany({
        where: { tag: "popular", isAvailable: true },
        select: { id: true, name: true, price: true, discountPrice: true, imageUrl: true, description: true, tag: true },
      });
    },
    ["public-popular-drinks"],
    { revalidate: 300, tags: ["drinks"] }
  )();
}

export async function getSpicyDishes() {
  return unstable_cache(
    async () => {
      return prisma.dish.findMany({
        where: { tag: "spicy", isAvailable: true },
        select: { id: true, name: true, price: true, discountPrice: true, imageUrl: true, description: true, tag: true },
      });
    },
    ["public-spicy-dishes"],
    { revalidate: 300, tags: ["dishes"] }
  )();
}

export async function getProductById(id: string) {
  return unstable_cache(
    async () => {
      const [dish, drink, combo] = await Promise.all([
        prisma.dish.findUnique({ where: { id }, select: { id: true, name: true, price: true, discountPrice: true, description: true, isAvailable: true, imageUrl: true, slug: true, tag: true, storeId: true } }),
        prisma.drink.findUnique({ where: { id }, select: { id: true, name: true, price: true, discountPrice: true, description: true, isAvailable: true, imageUrl: true, slug: true, tag: true, storeId: true } }),
        prisma.combo.findUnique({ where: { id }, select: { id: true, name: true, price: true, originalPrice: true, isAvailable: true, imageUrl: true, slug: true, items: true, storeId: true } }),
      ]);
      if (dish) return { type: "dish" as const, data: dish };
      if (drink) return { type: "drink" as const, data: drink };
      if (combo) return { type: "combo" as const, data: combo };
      return null;
    },
    ["public-product", id],
    { revalidate: 300, tags: ["dishes", "drinks"] }
  )();
}

export async function getRelatedProducts(type: "dish" | "drink" | "combo", excludeId: string, limit = 8) {
  if (type === "dish") {
    return prisma.dish.findMany({
      where: { id: { not: excludeId }, isAvailable: true },
      select: { id: true, name: true, price: true, discountPrice: true, imageUrl: true, tag: true },
      take: limit,
      orderBy: { createdAt: "desc" },
    });
  }
  if (type === "drink") {
    return prisma.drink.findMany({
      where: { id: { not: excludeId }, isAvailable: true },
      select: { id: true, name: true, price: true, discountPrice: true, imageUrl: true, tag: true },
      take: limit,
      orderBy: { createdAt: "desc" },
    });
  }
  return prisma.combo.findMany({
    where: { id: { not: excludeId }, isAvailable: true },
    select: { id: true, name: true, price: true, originalPrice: true, imageUrl: true, items: true },
    take: limit,
    orderBy: { createdAt: "desc" },
  });
}

export async function getAllDishes() {
  return unstable_cache(
    async () => {
      return prisma.dish.findMany({
        orderBy: { createdAt: "desc" },
        select: { id: true, name: true, price: true, discountPrice: true, imageUrl: true, description: true },
      });
    },
    ["public-all-dishes"],
    { revalidate: 300, tags: ["dishes"] }
  )();
}

export async function getAllDrinks() {
  return unstable_cache(
    async () => {
      return prisma.drink.findMany({
        orderBy: { createdAt: "desc" },
        select: { id: true, name: true, price: true, discountPrice: true, imageUrl: true, description: true },
      });
    },
    ["public-all-drinks"],
    { revalidate: 300, tags: ["drinks"] }
  )();
}
