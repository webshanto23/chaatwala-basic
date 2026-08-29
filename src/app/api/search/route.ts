import { NextResponse } from "next/server";
import { getFoodCatalog } from "@/features/food/queries";

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (!query) return NextResponse.json({ results: [] }, { headers: { "Cache-Control": "s-maxage=60, stale-while-revalidate=120" } });
  const { foods } = await getFoodCatalog({ query, limit: 20 });
  const results = foods.map((food) => {
    const category = food.kind === "COMBO" ? "Combo" : food.categories[0]?.name ?? "Food";
    return { id: food.id, label: food.name, description: food.description ?? food.componentFoodNames.join(", "), href: `/products/${food.id}`, category };
  });
  return NextResponse.json({ results }, { headers: { "Cache-Control": "s-maxage=60, stale-while-revalidate=120" } });
}
