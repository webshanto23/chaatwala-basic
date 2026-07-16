// import data from "../../../sitedata.json"
import { ComboSection } from "@/components/products/combos/ComboSection"
import { FloatingCart } from "@/components/shared/FloatingCart"
import { HeroSection } from "@/components/home/HeroSection"
import { SignatureSection } from "@/components/home/SignatureSection"
import { FeaturedPicks } from "@/components/home/featured-picks"

type SignatureItem = {
  id: number
  name: string
  price: number
  image: string
  rating: number
  tag?: "spicy" | "popular" | "new"
}

const normalizeTag = (tag: string | null | undefined): SignatureItem["tag"] => {
  if (tag === "spicy" || tag === "popular" || tag === "new") {
    return tag
  }

  return undefined
}

const mostLoved: SignatureItem[] = data.home.mostLoved.map((item) => ({
  ...item,
  tag: normalizeTag(item.tag),
}))

const spicyPicks: SignatureItem[] = data.home.spicyPicks.map((item) => ({
  ...item,
  tag: normalizeTag(item.tag),
}))

export default function Home() {
  return (
    <div className="flex flex-col flex-1 bg-background font-sans">
      <HeroSection />
      <FeaturedPicks />
      <SignatureSection title="Most Loved" items={mostLoved} color="primary" />
      <SignatureSection title="Spicy Picks" items={spicyPicks} color="secondary" />
      <ComboSection />

      <FloatingCart />
    </div>
  )
}
