import { AllDishesShowcase } from "@/components/products/dishes/AllDishesShowcase";
import { PopularDishes } from "@/components/products/dishes/PopularDishes";

export default function Dishes() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <PopularDishes />
      <AllDishesShowcase />
    </div>
  );
}
