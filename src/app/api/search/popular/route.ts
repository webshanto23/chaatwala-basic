import { NextResponse } from "next/server";
import { getFoodCatalog } from "@/features/food/queries";

export async function GET() {
  const { foods } = await getFoodCatalog({ tag: "popular", limit: 20 });
  return NextResponse.json({ tags: foods.map((food) => food.name) }, { headers: { "Cache-Control": "s-maxage=300, stale-while-revalidate=600" } });
}
