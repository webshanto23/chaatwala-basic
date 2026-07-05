"use client"

import data from "../../../../sitedata.json"
import { DishGrid } from "./DishGrid"

const alldishes = data.products.allDishes

export function AllDishesShowcase() {
  return (
    <section className="px-4 py-10 md:px-6 lg:px-8 bg-muted/20 dark:bg-muted">
      
      {/* Heading */}
      <div className="mb-8 text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground">
          All Dishes
        </h2>
        <p className="text-muted-foreground text-sm mt-1">
          Explore our full menu
        </p>
      </div>

      {/* Grid */}
      <DishGrid dishes={alldishes} />
    </section>
  )
}