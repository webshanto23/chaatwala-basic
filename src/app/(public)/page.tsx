import { HeroSection } from "@/components/home/HeroSection";
import { MostLoved, SpicyPicks } from "@/components/home/SignatureFromDb";
import { getPopularDishes, getPopularDrinks, getSpicyDishes } from "@/features/products/service";
import { shuffle } from "@/lib/utils";

export const revalidate = 300;

export default async function Home() {
  const [popularDishes, popularDrinks, spicyDishes] = await Promise.all([
    getPopularDishes(),
    getPopularDrinks(),
    getSpicyDishes(),
  ]);

  const toFoodItem = (d: { id: string; name: string; price: number | unknown; imageUrl: string | null; description: string | null; tag: string | null }, type: "dish" | "drink"): { id: string; name: string; price: number; image: string; detail: string; rating: number; type: "dish" | "drink"; tag?: "spicy" | "popular" | "new" } => ({
    id: d.id,
    name: d.name,
    price: Number(d.price),
    image: d.imageUrl ?? "",
    detail: d.description ?? "",
    rating: 4.8,
    type,
    tag: d.tag === "popular" ? "popular" : d.tag === "spicy" ? "spicy" : d.tag === "new" ? "new" : undefined,
  });

  const mostLoved = shuffle([
    ...popularDishes.map(d => toFoodItem(d, "dish")),
    ...popularDrinks.map(d => toFoodItem(d, "drink")),
  ]);

  const spicy = shuffle(spicyDishes.map(d => toFoodItem(d, "dish")));

  return (
    <div className="flex flex-col flex-1 bg-linear-to-r from-primary/10 via-secondary/10 to-accent/10 font-sans">
      <HeroSection />
      <MostLoved data={mostLoved} />
      <SpicyPicks data={spicy} />
    </div>
  );
}
