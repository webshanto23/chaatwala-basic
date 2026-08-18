import { ProductCard } from "@/components/shared/ProductCard";

type Dish = {
  id: string;
  name: string;
  price: number | string;
  originalPrice: number;
  discountPrice: number | null;
  image: string;
  detail?: string;
};

export function DishGrid({ dishes }: { dishes: Dish[] }) {
  return (
    <div className="flex gap-5 flex-wrap justify-center sm:justify-start">
      {dishes.map((dish) => (
        <ProductCard
          key={dish.id}
          id={dish.id}
          image={dish.image}
          name={dish.name}
          price={dish.price}
          originalPrice={dish.originalPrice}
          discountPrice={dish.discountPrice}
          detail={dish.detail}
          productType="dish"
          href={`/products/dishes/${dish.id}`}
        />
      ))}
    </div>
  );
}
