import { DishGrid } from "./DishGrid"

const dishes = [
  {
    id: 1,
    name: "Chicken Biryani",
    price: 250,
    image: "https://images.unsplash.com/photo-1627308595229-7830a5c91f9f",
  },
  {
    id: 2,
    name: "Beef Burger",
    price: 180,
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd",
  },
  {
    id: 3,
    name: "Grilled Chicken",
    price: 220,
    image: "https://images.unsplash.com/photo-1600891964599-f61ba0e24092",
  },
  {
    id: 4,
    name: "Fried Rice",
    price: 200,
    image: "https://images.unsplash.com/photo-1603133872878-684f208fb84b",
  },
]

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