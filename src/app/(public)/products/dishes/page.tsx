import { AllDishesShowcase } from "@/components/products/dishes/AllDishesShowcase";
import { PopularDishes } from "@/components/products/dishes/PopularDishes";

export default function DishesPage() {
  return (
    <div className="flex flex-col flex-1 font-sans">
      <PopularDishes />
      <AllDishesShowcase />
    </div>
  );
}
