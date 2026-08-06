import { getDrinks } from "@/features/products/actions";
import { DrinksClient } from "./DrinksClient";

export const revalidate = 60;

export default async function DrinksPage() {
  const result = await getDrinks();
  const drinks = result.drinks ?? [];

  return <DrinksClient initialDrinks={drinks} />;
}
