import { ProductCard } from "@/components/shared/ProductCard";

type Dish = {
  id: string;
  name: string;
  price: number | string;
  image: string;
  detail?: string;
};

export function DishGrid({ dishes }: { dishes: Dish[] }) {
  return (
    <div className="flex gap-5 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide">
      {dishes.map((dish) => (
        <ProductCard
          key={dish.id}
          id={dish.id}
          image={dish.image}
          name={dish.name}
          price={dish.price}
          detail={dish.detail}
          productType="dish"
          href={`/products/dishes/${dish.id}`}
        />
      ))}
    </div>
  );
}
