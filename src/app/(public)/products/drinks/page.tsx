import { AllDishesShowcase } from "@/components/products/dishes/AllDishesShowcase";
import { PopularDishes } from "@/components/products/dishes/PopularDishes";

export default function Drinks() {
  return (
    <div className="flex flex-col flex-1 bg-background font-sans">
      <PopularDishes />
      <AllDishesShowcase />
    </div>
  );
}
