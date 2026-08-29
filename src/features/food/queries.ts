import { unstable_cache } from "next/cache";
import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { calculateFood, foodWithPricingInclude, type CalculatedFood } from "./service";

export type FoodCatalogFilters = {
  category?: string;
  tag?: string;
  kind?: "STANDARD" | "COMBO";
  query?: string;
  storeId?: string;
  includeUnavailable?: boolean;
  limit?: number;
  cursor?: string;
};

export type FoodCatalogItem = CalculatedFood & {
  description: string | null;
  categories: { id: string; name: string; slug: string }[];
  tags: { id: string; name: string; slug: string }[];
  componentFoodIds: string[];
  componentFoodNames: string[];
};

export type FoodTaxonomy = {
  categories: { id: string; name: string; slug: string }[];
  tags: { id: string; name: string; slug: string }[];
};

const catalogInclude = {
  ...foodWithPricingInclude,
  categories: { include: { category: { select: { id: true, name: true, slug: true } } } },
  tags: { include: { tag: { select: { id: true, name: true, slug: true } } } },
} satisfies Prisma.FoodInclude;

function toCatalogItem(food: Prisma.FoodGetPayload<{ include: typeof catalogInclude }>, storeId?: string): FoodCatalogItem {
  const calculated = calculateFood(food, storeId);
  return {
    ...calculated,
    description: food.description,
    categories: food.categories.map(({ category }) => category),
    tags: food.tags.map(({ tag }) => tag),
    componentFoodIds: food.bundleItems.map(({ componentFoodId }) => componentFoodId),
    componentFoodNames: food.bundleItems.map(({ componentFood }) => componentFood.name),
  };
}

function catalogWhere(filters: FoodCatalogFilters): Prisma.FoodWhereInput {
  return {
    ...(filters.kind ? { kind: filters.kind } : {}),
    ...(filters.category ? { categories: { some: { category: { slug: filters.category } } } } : {}),
    ...(filters.tag ? { tags: { some: { tag: { slug: filters.tag } } } } : {}),
    ...(filters.query ? { name: { contains: filters.query, mode: "insensitive" } } : {}),
  };
}

export async function getFoodCatalog(filters: FoodCatalogFilters = {}) {
  const take = Math.min(Math.max(filters.limit ?? 24, 1), 100);
  const cursor = filters.cursor ? { id: filters.cursor } : undefined;
  const cacheKey = JSON.stringify({ ...filters, limit: take, cursor: undefined });
  const foods = await unstable_cache(
    () => prisma.food.findMany({
      where: catalogWhere(filters),
      include: catalogInclude,
      orderBy: { createdAt: "desc" },
      take,
      ...(cursor ? { cursor, skip: 1 } : {}),
    }),
    ["food-catalog", cacheKey, filters.cursor ?? "start"],
    { revalidate: 300, tags: ["foods"] },
  )();
  const items = foods.map((food) => toCatalogItem(food, filters.storeId));
  const visibleItems = filters.includeUnavailable ? items : items.filter((food) => food.isAvailable);
  return {
    foods: visibleItems,
    nextCursor: foods.length === take ? foods[foods.length - 1].id : null,
  };
}

export async function getFoodById(id: string, storeId?: string) {
  const food = await prisma.food.findUnique({ where: { id }, include: catalogInclude });
  return food ? toCatalogItem(food, storeId) : null;
}

export async function getFoodTaxonomy(): Promise<FoodTaxonomy> {
  return unstable_cache(
    async () => {
      const [categories, tags] = await Promise.all([
        prisma.foodCategory.findMany({ select: { id: true, name: true, slug: true }, orderBy: { name: "asc" } }),
        prisma.foodTag.findMany({ select: { id: true, name: true, slug: true }, orderBy: { name: "asc" } }),
      ]);
      return { categories, tags };
    },
    ["food-taxonomy"],
    { revalidate: 300, tags: ["foods"] },
  )();
}
