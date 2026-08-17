import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

type SearchResult = {
  id: string;
  label: string;
  description: string;
  href: string;
  category: string;
};

function normalizeTerm(term: string) {
  return term.trim().toLowerCase();
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawQuery = searchParams.get("q")?.trim() ?? "";

  if (!rawQuery) {
    return new NextResponse(JSON.stringify({ results: [] as SearchResult[] }), {
      headers: { "Content-Type": "application/json", "Cache-Control": "s-maxage=60, stale-while-revalidate=120" },
    });
  }

  const term = normalizeTerm(rawQuery);

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
      href: `/products/dishes/${dish.id}`,
      category: dish.tag ?? "Dish",
    })),
    ...drinks.map((drink) => ({
      id: drink.id,
      label: drink.name,
      description: drink.description ?? "",
      href: `/products/drinks/${drink.id}`,
      category: drink.tag ?? "Drink",
    })),
    ...combos.map((combo) => ({
      id: combo.id,
      label: combo.name,
      description: Array.isArray(combo.items)
        ? combo.items.slice(0, 3).join(", ")
        : "",
      href: `/products/combos/${combo.id}`,
      category: "Combo",
    })),
  ];

  return new NextResponse(JSON.stringify({ results }), {
    headers: { "Content-Type": "application/json", "Cache-Control": "s-maxage=60, stale-while-revalidate=120" },
  });
}
