import { getDishes } from "@/features/products/actions";
import { DishesClient } from "./DishesClient";

export const revalidate = 60;

export default async function DishesPage() {
  const result = await getDishes({ limit: 20 });
  const dishes = result.dishes ?? [];

  return <DishesClient initialDishes={dishes} initialNextCursor={result.nextCursor} />;
}
