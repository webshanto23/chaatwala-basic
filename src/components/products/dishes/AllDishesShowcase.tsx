"use client"

import Image from "next/image"
import { DishGrid } from "./DishGrid"

const alldishes = [
  {
    id: 1,
    name: "Raj Kachori",
    price: 200,
    image: "https://images.unsplash.com/photo-1601050690597-df0568f70950",
  },
  {
    id: 2,
    name: "Chole Bhature",
    price: 300,
    image: "https://images.unsplash.com/photo-1600891964599-f61ba0e24092",
  },
  {
    id: 3,
    name: "Gol Gappe",
    price: 100,
    image: "https://images.unsplash.com/photo-1603133872878-684f208fb84b",
  },
  {
    id: 4,
    name: "Singara Chaat",
    price: 150,
    image: "https://images.unsplash.com/photo-1631515243349-e0cb75fb8d3a",
  },
  {
    id: 5,
    name: "Pav Bhaji",
    price: 250,
    image: "https://images.unsplash.com/photo-1603133872878-684f208fb84b",
  },
  {
    id: 6,
    name: "Dahi Puri",
    price: 180,
    image: "https://images.unsplash.com/photo-1603133872878-684f208fb84b",
  },
]

export function AllDishesShowcase() {
  return (
    <section className="px-4 py-10 md:px-10 bg-zinc-50 dark:bg-zinc-900">
      
      {/* Heading */}
      <div className="mb-8 text-center">
        <h2 className="text-2xl md:text-3xl font-bold">
          All Dishes
        </h2>
        <p className="text-muted-foreground text-sm">
          Explore our full menu
        </p>
      </div>

      {/* Grid */}
      <DishGrid dishes={alldishes} />
    </section>
  )
}