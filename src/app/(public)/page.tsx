import { ComboSection } from "@/components/products/combos/ComboSection";
import { FloatingCart } from "@/components/shared/FloatingCart";
import { HeroSection } from "@/components/home/HeroSection";
import { MostLoved, SpicyPicks } from "@/components/home/SignatureFromDb";
import { FeaturedPicks } from "@/components/home/featured-picks";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 bg-background font-sans">
      <HeroSection />
      {/* <FeaturedPicks /> */}
      <MostLoved />
      <SpicyPicks />
      {/* <ComboSection /> */}

      <FloatingCart />
    </div>
  );
}
