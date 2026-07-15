import prisma from "@/lib/prisma"
import { DishGrid } from "./DishGrid"

export async function PopularDishes() {
  const dishesFromDb = await prisma.dish.findMany({
    where: { tag: "popular" },
    orderBy: { createdAt: "desc" },
  })

  const dishes = dishesFromDb.map((dish) => ({
    id: dish.id,
    name: dish.name,
    price: Number(dish.price),
    image: dish.imageUrl ?? "",
  }))

  return (
    <section className="px-4 py-6 md:px-6 lg:px-8 max-w-7xl mx-auto bg-gradient-to-br from-white via-secondary/10 to-white rounded-[2rem] border border-border/70 shadow-lg shadow-secondary/10">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Popular Dishes</h2>
          <p className="text-sm text-muted-foreground">Handpicked favorites from our menu.</p>
        </div>
        <button className="rounded-full border border-border/70 bg-background px-4 py-2 text-sm text-foreground transition hover:border-primary hover:text-primary">
          View all
        </button>
      </div>

      <DishGrid dishes={dishes} />
    </section>
  )
}
