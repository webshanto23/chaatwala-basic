import { ComboSection } from "@/components/products/combos/ComboSection"
import { FloatingCart } from "@/components/shared/FloatingCart"
import { HeroSection } from "@/components/home/HeroSection"
import { SignatureSection } from "@/components/home/SignatureSection"

const mostLoved = [
  { id: 1, name: "Pani Puri", price: 120, image: "https://images.unsplash.com/photo-1603133872878-684f208fb84b", rating: 4.9, tag: "popular" as const },
  { id: 2, name: "Bhel Puri", price: 100, image: "https://images.unsplash.com/photo-1600891964599-f61ba0e24092", rating: 4.8, tag: "spicy" as const },
  { id: 3, name: "Dahi Puri", price: 150, image: "https://images.unsplash.com/photo-1601050690597-df0568f70950", rating: 4.7, tag: "new" as const },
  { id: 4, name: "Aloo Tikki", price: 80, image: "https://images.unsplash.com/photo-1631515243349-e0cb75fb8d3a", rating: 4.6 },
]

const spicyPicks = [
  { id: 5, name: "Fire Noodles", price: 180, image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd", rating: 4.8, tag: "spicy" as const },
  { id: 6, name: "Extra Spicy Wings", price: 220, image: "https://images.unsplash.com/photo-1600891964599-f61ba0e24092", rating: 4.7, tag: "spicy" as const },
  { id: 7, name: "Hot Bharta", price: 160, image: "https://images.unsplash.com/photo-1627308595229-7830a5c91f9f", rating: 4.6, tag: "spicy" as const },
  { id: 8, name: "Hot Bharta", price: 160, image: "https://images.unsplash.com/photo-1627308595229-7830a5c91f9f", rating: 4.6, tag: "spicy" as const },
]

export default function Home() {
  return (
    <div className="flex flex-col flex-1 bg-background font-sans">
      <HeroSection />
      <SignatureSection title="Most Loved" items={mostLoved} color="primary" />
      <SignatureSection title="Spicy Picks" items={spicyPicks} color="secondary" />
      <ComboSection />
      
      <FloatingCart />
    </div>
  )
}
