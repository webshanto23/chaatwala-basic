import { HeroSection } from "@/components/home/HeroSection";
import { MostLoved, SpicyPicks } from "@/components/home/SignatureFromDb";
import {
  getPopularDishes,
  getPopularDrinks,
  getSpicyDishes,
} from "@/features/products/service";
import { shuffle } from "@/lib/utils";
import { getHeroSettings } from "@/features/site-settings/service";

export const revalidate = 300;

export default async function Home() {
  const [popularDishes, popularDrinks, spicyDishes, heroSettings] = await Promise.all([
    getPopularDishes(),
    getPopularDrinks(),
    getSpicyDishes(),
    getHeroSettings(),
  ]);

  const toFoodItem = (
    d: {
      id: string;
      name: string;
      price: number | unknown;
      discountPrice: number | unknown | null;
      imageUrl: string | null;
      description: string | null;
      tag: string | null;
    },
    type: "dish" | "drink",
  ): {
    id: string;
    name: string;
    price: number;
    originalPrice: number;
    discountPrice: number | null;
    image: string;
    detail: string;
    rating: number;
    type: "dish" | "drink";
    tag?: "spicy" | "popular" | "new";
  } => {
    const basePrice = Number(d.price);
    const discount = d.discountPrice !== null && d.discountPrice !== undefined ? Number(d.discountPrice) : null;
    return {
      id: d.id,
      name: d.name,
      price: discount ?? basePrice,
      originalPrice: basePrice,
      discountPrice: discount,
      image: d.imageUrl ?? "",
      detail: d.description ?? "",
      rating: 4.8,
      type,
      tag:
        d.tag === "popular"
          ? "popular"
          : d.tag === "spicy"
            ? "spicy"
            : d.tag === "new"
              ? "new"
              : undefined,
    };
  };

  const mostLoved = shuffle([
    ...popularDishes.map((d) => toFoodItem(d, "dish")),
    ...popularDrinks.map((d) => toFoodItem(d, "drink")),
  ]);

  const spicy = shuffle(spicyDishes.map((d) => toFoodItem(d, "dish")));

  return (
    <div className="flex flex-col flex-1 font-sans bg-linear-to-r from-primary/10 via-secondary/10 to-accent/10">
      <HeroSection imageUrl={heroSettings.imageUrl} imageAlt={heroSettings.imageAlt} />
      <MostLoved data={mostLoved} />
      <SpicyPicks data={spicy} />
    </div>
  );
}
