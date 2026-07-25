export const revalidate = 300;

import prisma from "@/lib/prisma";
import { SignatureSection, type FoodItem } from "./SignatureSection";

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

async function getMostLoved(): Promise<FoodItem[]> {
  const [dishes, drinks] = await Promise.all([
    prisma.dish.findMany({
      where: { tag: "popular" },
      orderBy: { createdAt: "desc" },
    }),
    prisma.drink.findMany({
      where: { tag: "popular" },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const items: FoodItem[] = [
    ...dishes.map((d) => ({
      id: d.id,
      name: d.name,
      price: Number(d.price),
      image: d.imageUrl ?? "",
      detail: d.description ?? "",
      rating: 4.8,
      type: "dish" as const,
      tag: normalizeTag(d.tag),
    })),
    ...drinks.map((d) => ({
      id: d.id,
      name: d.name,
      price: Number(d.price),
      detail: d.description ?? "",
      image: d.imageUrl ?? "",
      rating: 4.8,
      type: "drink" as const,
      tag: normalizeTag(d.tag),
    })),
  ];

  return shuffle(items);
}

async function getSpicyPicks(): Promise<FoodItem[]> {
  const dishes = await prisma.dish.findMany({
    where: { tag: "spicy" },
    orderBy: { createdAt: "desc" },
  });

  const items: FoodItem[] = dishes.map((d) => ({
    id: d.id,
    name: d.name,
    price: Number(d.price),
    image: d.imageUrl ?? "",
    detail: d.description ?? "",
      rating: 4.8,
      type: "dish" as const,
      tag: "spicy" as const,
  }));

  return shuffle(items);
}

export async function MostLoved() {
  return <SignatureSection title="Most Loved" items={await getMostLoved()} />;
}

export async function SpicyPicks() {
  return <SignatureSection title="Spicy Picks" items={await getSpicyPicks()} />;
}
