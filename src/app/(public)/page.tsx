import { HeroSection } from "@/components/home/HeroSection";
import { MostLoved, SpicyPicks } from "@/components/home/SignatureFromDb";

export const revalidate = 300;

export default function Home() {
  return (
    <div className="flex flex-col flex-1 bg-linear-to-r from-primary/10 via-secondary/10 to-accent/10 font-sans">
      <HeroSection />
      {/* <FeaturedPicks /> */}
      <MostLoved />
      <SpicyPicks />
      {/* <ComboSection /> */}
    </div>
  );
}
