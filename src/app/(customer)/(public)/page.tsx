import { HeroSection } from "@/components/home/HeroSection";
import { MostLoved, SpicyPicks } from "@/components/home/SignatureFromDb";
import { getFoodCatalog, type FoodCatalogItem } from "@/features/food/queries";
import { shuffle } from "@/lib/utils";
import { getHeroSettings } from "@/features/site-settings/service";

export const revalidate = 300;

export default async function Home() {
  const [popularCatalog, spicyCatalog, heroSettings] = await Promise.all([
    getFoodCatalog({ tag: "popular", limit: 24 }),
    getFoodCatalog({ tag: "spicy", limit: 24 }),
    getHeroSettings(),
  ]);

  const toFoodItem = (food: FoodCatalogItem): {
    id: string;
    name: string;
    price: number;
    originalPrice: number;
    discountPrice: number | null;
    image: string;
    detail: string;
    rating: number;
    tag?: "spicy" | "popular" | "new";
  } => {
    const basePrice = food.basePrice;
    const discount = food.finalPrice < food.basePrice ? food.finalPrice : null;
    return {
      id: food.id,
      name: food.name,
      price: discount ?? basePrice,
      originalPrice: basePrice,
      discountPrice: discount,
      image: food.imageUrl ?? "",
      detail: food.description ?? (food.kind === "COMBO" ? food.componentFoodNames.join(", ") : ""),
      rating: 4.8,
      tag:
        food.tags.some((tag) => tag.slug === "popular")
          ? "popular"
          : food.tags.some((tag) => tag.slug === "spicy")
            ? "spicy"
            : food.tags.some((tag) => tag.slug === "new")
              ? "new"
              : undefined,
    };
  };

  const mostLoved = shuffle(popularCatalog.foods.map(toFoodItem));
  const spicy = shuffle(spicyCatalog.foods.map(toFoodItem));

  return (
    <div className="flex flex-col flex-1 font-sans bg-linear-to-r from-primary/10 via-secondary/10 to-accent/10">
      <HeroSection imageUrl={heroSettings.imageUrl} imageAlt={heroSettings.imageAlt} />
      <MostLoved data={mostLoved} />
      <SpicyPicks data={spicy} />
    </div>
  );
}
