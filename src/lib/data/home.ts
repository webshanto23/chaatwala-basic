import prisma from "@/lib/prisma";
import type { FoodItem } from "@/components/home/SignatureSection";

const normalizeTag = (tag: string | null | undefined): FoodItem["tag"] => {
  if (tag === "spicy" || tag === "popular" || tag === "new") return tag;
  return undefined;
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export async function getHomeData() {
  const [mostLovedDishes, mostLovedDrinks, spicyDishes] = await Promise.all([
    prisma.dish.findMany({
      where: { tag: "popular" },
      select: { id: true, name: true, price: true, imageUrl: true, description: true, tag: true },
    }),
    prisma.drink.findMany({
      where: { tag: "popular" },
      select: { id: true, name: true, price: true, imageUrl: true, description: true, tag: true },
    }),
    prisma.dish.findMany({
      where: { tag: "spicy" },
      select: { id: true, name: true, price: true, imageUrl: true, description: true, tag: true },
    }),
  ]);

  const toFoodItem = (d: {
    id: string;
    name: string;
    price: unknown;
    imageUrl: string | null;
    description: string | null;
    tag: string | null;
  }, type: "dish" | "drink"): FoodItem => ({
    id: d.id,
    name: d.name,
    price: Number(d.price),
    image: d.imageUrl ?? "",
    detail: d.description ?? "",
    rating: 4.8,
    type,
    tag: normalizeTag(d.tag),
  });

  const mostLoved = shuffle([
    ...mostLovedDishes.map((d) => toFoodItem(d, "dish")),
    ...mostLovedDrinks.map((d) => toFoodItem(d, "drink")),
  ]);

  const spicy = shuffle(spicyDishes.map((d) => toFoodItem(d, "dish")));

  return { mostLoved, spicy };
}
