import { getDishes } from "@/features/products/actions";
import { DishesClient } from "./DishesClient";

export const revalidate = 60;

export default async function DishesPage() {
  const result = await getDishes();
  const dishes = result.dishes ?? [];

  return <DishesClient initialDishes={dishes} />;
}
