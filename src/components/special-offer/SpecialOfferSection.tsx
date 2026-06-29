import { SpecialOfferCard } from "./SpecialOfferCard"

const specialDish = {
  name: "Kacchi Biryani",
  price: 199,
  oldPrice: 299,
  image: "https://images.unsplash.com/photo-1603133872878-684f208fb84b",
}

export function SpecialOfferSection() {
  return (
    <section className="px-4 py-6 md:px-6 lg:px-8 max-w-7xl mx-auto">
      <h2 className="text-lg font-semibold text-foreground mb-4">
        Today&apos;s Special Offer
      </h2>

      <SpecialOfferCard dish={specialDish} />

    </section>
  )
}