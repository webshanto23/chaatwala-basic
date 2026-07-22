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

  return NextResponse.json({ tags });
}
