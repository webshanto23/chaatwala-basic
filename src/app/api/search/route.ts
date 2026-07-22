import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const CACHE_TTL = 60 * 1000;
const MAX_CACHE_SIZE = 200;

type SearchResult = {
  id: string;
  label: string;
  description: string;
  href: string;
  category: string;
};

const searchCache = new Map<
  string,
  { data: SearchResult[]; timestamp: number }
>();

function normalizeTerm(term: string) {
  return term.trim().toLowerCase();
}

async function getCachedResults(term: string): Promise<SearchResult[] | null> {
  const key = term;
  const entry = searchCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    searchCache.delete(key);
    return null;
  }
  return entry.data;
}

function setCachedResults(term: string, data: SearchResult[]) {
  searchCache.set(term, { data, timestamp: Date.now() });
  if (searchCache.size > MAX_CACHE_SIZE) {
    const now = Date.now();
    for (const [key, value] of searchCache.entries()) {
      if (now - value.timestamp > CACHE_TTL) {
        searchCache.delete(key);
      }
    }
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawQuery = searchParams.get("q")?.trim() ?? "";

  if (!rawQuery) {
    return NextResponse.json({ results: [] as SearchResult[] });
  }

  const term = normalizeTerm(rawQuery);

  const cached = await getCachedResults(term);
  if (cached) {
    return NextResponse.json({ results: cached });
  }

  const [dishes, drinks, combos] = await Promise.all([
    prisma.dish.findMany({
      where: {
        isAvailable: true,
        OR: [
          { name: { contains: term, mode: "insensitive" } },
          { description: { contains: term, mode: "insensitive" } },
          { tag: { contains: term, mode: "insensitive" } },
        ],
      },
      select: { id: true, name: true, description: true, tag: true },
    }),
    prisma.drink.findMany({
      where: {
        isAvailable: true,
        OR: [
          { name: { contains: term, mode: "insensitive" } },
          { description: { contains: term, mode: "insensitive" } },
          { tag: { contains: term, mode: "insensitive" } },
        ],
      },
      select: { id: true, name: true, description: true, tag: true },
    }),
    prisma.combo.findMany({
      where: {
        isAvailable: true,
        OR: [
          { name: { contains: term, mode: "insensitive" } },
        ],
      },
      select: { id: true, name: true, items: true },
    }),
  ]);

  const results: SearchResult[] = [
    ...dishes.map((dish) => ({
      id: dish.id,
      label: dish.name,
      description: dish.description ?? "",
      href: `/products/dishes`,
      category: dish.tag ?? "Dish",
    })),
    ...drinks.map((drink) => ({
      id: drink.id,
      label: drink.name,
      description: drink.description ?? "",
      href: `/products/drinks`,
      category: drink.tag ?? "Drink",
    })),
    ...combos.map((combo) => ({
      id: combo.id,
      label: combo.name,
      description: Array.isArray(combo.items)
        ? combo.items.slice(0, 3).join(", ")
        : "",
      href: `/products/combos`,
      category: "Combo",
    })),
  ];

  setCachedResults(term, results);

  return NextResponse.json({ results });
}
