import data from "../../../../sitedata.json"
import { DishGrid } from "./DishGrid"

const dishes = data.products.popularDishes

export function PopularDishes() {
  return (
    <section className="px-4 py-6 md:px-6 lg:px-8 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">
          Popular Dishes
        </h2>
        <button className="text-sm text-muted-foreground hover:text-primary transition-colors">
          View all
        </button>
      </div>

      {/* Grid */}
      <DishGrid dishes={dishes} />

    </section>
  )
}