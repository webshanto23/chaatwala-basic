import { ProductCard } from "@/components/shared/ProductCard";
import type { FoodCatalogItem } from "@/features/food/queries";

export function FoodCatalogGrid({ foods }: { foods: FoodCatalogItem[] }) {
  if (!foods.length) return <div className="rounded-2xl border border-dashed border-border bg-card/60 p-12 text-center text-sm text-muted-foreground">No available products in this category yet.</div>;

  return (
    <div className="flex flex-wrap justify-center gap-5 sm:justify-start">
      {foods.map((food) => (
        <ProductCard
          key={food.id}
          id={food.id}
          image={food.imageUrl ?? "/images/chatwala_logo.png"}
          name={food.name}
          price={food.finalPrice}
          originalPrice={food.basePrice}
          discountPrice={food.finalPrice < food.basePrice ? food.finalPrice : null}
          detail={food.description ?? (food.kind === "COMBO" ? food.componentFoodNames.join(", ") : "")}
          customBadge={food.kind === "COMBO" ? "Combo" : undefined}
          productType="food"
          href={`/products/${food.id}`}
        />
      ))}
    </div>
  );
}
