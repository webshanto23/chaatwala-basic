export const revalidate = 300;

import prisma from "@/lib/prisma"
import { DrinkGrid } from "./DrinkGrid"

export async function AllDrinks() {
  const alldrinks = await prisma.drink.findMany({
    orderBy: { createdAt: "desc" },
  })

  const drinks = alldrinks.map((drink) => ({
    id: drink.id,
    name: drink.name,
    detail: drink.description ?? "",
    price: Number(drink.price),
    image: drink.imageUrl ?? "",
  }))

  return (
    <section className="px-4 py-10 md:px-6 lg:px-8 bg-gradient-to-br from-secondary/5 via-background to-primary/10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 rounded-[2rem] border border-border/70 bg-card/90 p-8 text-center shadow-[0_32px_120px_-70px_rgba(59,130,246,0.25)] backdrop-blur-xl">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">All Drinks</h2>
          <p className="mt-2 text-sm text-muted-foreground">Explore our full menu</p>
        </div>
        <DrinkGrid drinks={drinks} />
      </div>
    </section>
  )
}
