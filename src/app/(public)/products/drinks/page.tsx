import { AllDrinks } from "@/components/products/drinks/AllDrinks";
import { PopularDrinks } from "@/components/products/drinks/PopularDrinks";

export default function DrinksPage() {
  return (
    <div className="flex flex-1 flex-col bg-background font-sans">
      <PopularDrinks />
      <AllDrinks />
    </div>
  );
}
