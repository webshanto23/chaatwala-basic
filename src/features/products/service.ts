import prisma from "@/lib/prisma";
import { unstable_cache } from "next/cache";

export async function getPopularDishes() {
  return unstable_cache(
    async () => {
      return prisma.dish.findMany({
        where: { tag: "popular", isAvailable: true },
        select: { id: true, name: true, price: true, imageUrl: true, description: true, tag: true },
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
        select: { id: true, name: true, price: true, imageUrl: true, description: true, tag: true },
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
        select: { id: true, name: true, price: true, imageUrl: true, description: true, tag: true },
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
        prisma.dish.findUnique({ where: { id }, select: { id: true, name: true, price: true, discountPrice: true, description: true, isAvailable: true, imageUrl: true, slug: true } }),
        prisma.drink.findUnique({ where: { id }, select: { id: true, name: true, price: true, discountPrice: true, description: true, isAvailable: true, imageUrl: true, slug: true } }),
        prisma.combo.findUnique({ where: { id }, select: { id: true, name: true, price: true, originalPrice: true, isAvailable: true, imageUrl: true, slug: true, items: true } }),
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

export async function getAllDishes() {
  return unstable_cache(
    async () => {
      return prisma.dish.findMany({
        orderBy: { createdAt: "desc" },
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
      });
    },
    ["public-all-drinks"],
    { revalidate: 300, tags: ["drinks"] }
  )();
}
