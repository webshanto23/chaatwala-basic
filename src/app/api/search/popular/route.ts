import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  const [popularDishes, popularDrinks] = await Promise.all([
    prisma.dish.findMany({
      where: { tag: "popular", isAvailable: true },
      select: { name: true },
    }),
    prisma.drink.findMany({
      where: { tag: "popular", isAvailable: true },
      select: { name: true },
    }),
  ]);

  const tags = [
    ...popularDishes.map((d) => d.name),
    ...popularDrinks.map((d) => d.name),
  ];

  return new NextResponse(JSON.stringify({ tags }), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "s-maxage=300, stale-while-revalidate=600",
    },
  });
}
