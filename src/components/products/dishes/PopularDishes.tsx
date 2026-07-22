import prisma from "@/lib/prisma";
import { DishGrid } from "./DishGrid";

export async function PopularDishes() {
  const dishesFromDb = await prisma.dish.findMany({
    where: { tag: "popular" },
    orderBy: { createdAt: "desc" },
  });

  const dishes = dishesFromDb.map((dish) => ({
    id: dish.id,
    name: dish.name,
    price: Number(dish.price),
    image: dish.imageUrl ?? "",
    detail: dish.description ?? "",
  }));

  return (
    <section className="px-4 md:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="my-10 flex flex-col lg:flex-row items-start lg:items-center justify-between rounded-[2rem] border border-border/70 bg-card/90 p-8 text-center lg:text-left shadow-[0_32px_120px_-70px_rgba(59,130,246,0.25)] backdrop-blur-xl">
          {/* Left side */}
          <div className="flex flex-col">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">
              Popular Dishes
            </h2>
            <p className="mt-2 mb-4 text-sm text-muted-foreground">
              Handpicked favorites from our menu.
            </p>
          </div>

          {/* Right side */}
          <div className="w-full lg:w-auto">
            <button className="w-full lg:w-auto rounded-full border border-border/70 bg-background px-4 py-2 text-sm text-foreground transition hover:border-primary hover:text-primary">
              View all
            </button>
          </div>
        </div>
        <DishGrid dishes={dishes} />
      </div>
    </section>
  );
}
