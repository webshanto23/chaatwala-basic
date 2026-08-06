import prisma from "@/lib/prisma";

export async function getPopularDishes() {
  return prisma.dish.findMany({
    where: { tag: "popular", isAvailable: true },
    select: { id: true, name: true, price: true, imageUrl: true, description: true, tag: true },
  });
}

export async function getPopularDrinks() {
  return prisma.drink.findMany({
    where: { tag: "popular", isAvailable: true },
    select: { id: true, name: true, price: true, imageUrl: true, description: true, tag: true },
  });
}

export async function getSpicyDishes() {
  return prisma.dish.findMany({
    where: { tag: "spicy", isAvailable: true },
    select: { id: true, name: true, price: true, imageUrl: true, description: true, tag: true },
  });
}

export async function getProductById(id: string) {
  const [dish, drink, combo] = await Promise.all([
    prisma.dish.findUnique({ where: { id }, select: { id: true, name: true, price: true, discountPrice: true, description: true, isAvailable: true, imageUrl: true, slug: true } }),
    prisma.drink.findUnique({ where: { id }, select: { id: true, name: true, price: true, discountPrice: true, description: true, isAvailable: true, imageUrl: true, slug: true } }),
    prisma.combo.findUnique({ where: { id }, select: { id: true, name: true, price: true, originalPrice: true, isAvailable: true, imageUrl: true, slug: true, items: true } }),
  ]);
  if (dish) return { type: "dish" as const, data: dish };
  if (drink) return { type: "drink" as const, data: drink };
  if (combo) return { type: "combo" as const, data: combo };
  return null;
}
