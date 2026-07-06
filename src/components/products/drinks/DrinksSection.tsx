"use client"

import { DrinkCard } from "./DrinkCard"
import data from "../../../../sitedata.json"

const drinks = [
  {
    id: 1,
    name: "Mango Lassi",
    detail: "Creamy yogurt drink with mango",
    price: 90,
    image: "https://images.unsplash.com/photo-1510626176961-4b3b9d0635c2",
  },
  {
    id: 2,
    name: "Masala Soda",
    detail: "Sparkling soda with spices",
    price: 70,
    image: "https://images.unsplash.com/photo-1551024709-8f23befc6e3b",
  },
  {
    id: 3,
    name: "Lemon Mint Cooler",
    detail: "Fresh citrus with mint",
    price: 80,
    image: "https://images.unsplash.com/photo-1497534446932-c925b458314e",
  },
  {
    id: 4,
    name: "Rose Sharbat",
    detail: "Floral refreshment with rose essence",
    price: 95,
    image: "https://images.unsplash.com/photo-1510853676865-1d2ea327e2f7",
  },
]

export function DrinksSection() {
  return (
    <section className="px-4 py-10 sm:px-6 lg:px-8 bg-gradient-to-br from-secondary/5 via-background to-primary/10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 rounded-[2rem] border border-border/70 bg-white/90 p-8 shadow-[0_32px_120px_-70px_rgba(59,130,246,0.25)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-secondary">Refreshing drinks</p>
              <h2 className="mt-2 text-3xl font-bold text-foreground">Chilled beverages</h2>
            </div>
            <p className="max-w-xl text-sm text-muted-foreground">
              Cool down with our handcrafted drinks using the same premium ingredients as our signature dishes.
            </p>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {drinks.map((drink) => (
            <DrinkCard key={drink.id} drink={drink} />
          ))}
        </div>
      </div>
    </section>
  )
}
