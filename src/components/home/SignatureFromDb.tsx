import { SignatureSection, type FoodItem } from "./SignatureSection";

export async function MostLoved({ data }: { data: FoodItem[] }) {
  return <SignatureSection title="Most Loved" items={data} />;
}

export async function SpicyPicks({ data }: { data: FoodItem[] }) {
  return <SignatureSection title="Spicy Picks" items={data} />;
}
