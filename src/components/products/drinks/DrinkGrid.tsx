import { ProductCard } from "@/components/shared/ProductCard";

type Drink = {
  id: string;
  name: string;
  detail: string;
  price: number | string;
  image: string;
};

export function DrinkGrid({ drinks }: { drinks: Drink[] }) {
  return (
    <div className="flex gap-5 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide">
      {drinks.map((drink) => (
        <ProductCard
          key={drink.id}
          id={drink.id}
          image={drink.image}
          name={drink.name}
          price={drink.price}
          detail={drink.detail}
          customBadge=""
          productType="drink"
          href={`/products/drinks/${drink.id}`}
        />
      ))}
    </div>
  );
}
