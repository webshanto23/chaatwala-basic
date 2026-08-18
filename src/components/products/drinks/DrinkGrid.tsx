import { ProductCard } from "@/components/shared/ProductCard";

type Drink = {
  id: string;
  name: string;
  detail: string;
  price: number | string;
  originalPrice: number;
  discountPrice: number | null;
  image: string;
};

export function DrinkGrid({ drinks }: { drinks: Drink[] }) {
  return (
    <div className="flex gap-5 flex-wrap justify-center md:justify-start">
      {drinks.map((drink) => (
        <ProductCard
          key={drink.id}
          id={drink.id}
          image={drink.image}
          name={drink.name}
          price={drink.price}
          originalPrice={drink.originalPrice}
          discountPrice={drink.discountPrice}
          detail={drink.detail}
          customBadge=""
          productType="drink"
          href={`/products/drinks/${drink.id}`}
        />
      ))}
    </div>
  );
}
