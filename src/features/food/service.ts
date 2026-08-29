import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";

export type CalculatedFood = {
  id: string;
  name: string;
  slug: string;
  kind: "STANDARD" | "COMBO";
  basePrice: number;
  discountPercent: number;
  finalPrice: number;
  isAvailable: boolean;
  imageUrl: string | null;
};

export const foodWithPricingInclude = {
  bundleItems: { include: { componentFood: { include: { storeAvailability: true } } } },
  storeAvailability: true,
} satisfies Prisma.FoodInclude;

type FoodWithPricing = Prisma.FoodGetPayload<{ include: typeof foodWithPricingInclude }>;

const money = (value: number) => Math.round(value * 100) / 100;

export function calculateDiscountedPrice(basePrice: number, discountPercent: number) {
  return money(basePrice * (1 - discountPercent / 100));
}

function availableAtStore(food: Pick<FoodWithPricing, "isAvailable" | "storeAvailability">, storeId?: string) {
  const override = storeId ? food.storeAvailability.find((entry) => entry.storeId === storeId) : undefined;
  return food.isAvailable && override?.isAvailable !== false;
}

export function calculateFood(food: FoodWithPricing, storeId?: string): CalculatedFood {
  const storeAvailable = availableAtStore(food, storeId);
  if (food.kind === "STANDARD") {
    const basePrice = Number(food.basePrice);
    const discountPercent = Number(food.discountPercent);
    return {
      id: food.id, name: food.name, slug: food.slug, kind: food.kind,
      basePrice, discountPercent, finalPrice: calculateDiscountedPrice(basePrice, discountPercent),
      isAvailable: storeAvailable, imageUrl: food.imageUrl,
    };
  }

  const components = food.bundleItems;
  const componentsAvailable = components.length >= 2 && components.every(({ componentFood }) => availableAtStore(componentFood, storeId));
  const basePrice = components.reduce((total, { componentFood, quantity }) => {
    return total + calculateDiscountedPrice(Number(componentFood.basePrice), Number(componentFood.discountPercent)) * quantity;
  }, 0);
  const discountPercent = Number(food.discountPercent);
  return {
    id: food.id, name: food.name, slug: food.slug, kind: food.kind,
    basePrice: money(basePrice), discountPercent, finalPrice: calculateDiscountedPrice(basePrice, discountPercent),
    isAvailable: storeAvailable && componentsAvailable, imageUrl: food.imageUrl,
  };
}

export async function getCalculatedFood(id: string, storeId?: string): Promise<CalculatedFood | null> {
  const food = await prisma.food.findUnique({ where: { id }, include: foodWithPricingInclude });
  return food ? calculateFood(food, storeId) : null;
}

export async function isFoodAvailableAtStore(foodId: string, storeId: string) {
  return Boolean((await getCalculatedFood(foodId, storeId))?.isAvailable);
}
