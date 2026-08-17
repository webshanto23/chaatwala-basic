import { getPopularDrinks } from "@/features/products/service";
import { DrinkGrid } from "./DrinkGrid";

export async function PopularDrinks() {
  const drinksFromDb = await getPopularDrinks();

  const drinks = drinksFromDb.map((drink) => ({
    id: drink.id,
    name: drink.name,
    detail: drink.description ?? "",
    price: Number(drink.price),
    image: drink.imageUrl ?? "",
  }));

  return (
    <section className="px-4 md:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Header Card */}
        <div className="my-10 flex flex-col lg:flex-row items-start lg:items-center justify-between rounded-[2rem] border border-border/70 bg-card/90 p-8 text-center lg:text-left shadow-[0_32px_120px_-70px_rgba(59,130,246,0.25)] backdrop-blur-xl">
          {/* Left side */}
          <div className="flex flex-col">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">
              Popular Drinks
            </h2>
            <p className="mt-2 mb-4 text-sm text-muted-foreground">
              Handpicked favorites from our menu.
            </p>
          </div>

          {/* Right side */}
        </div>

        {/* Grid */}
        <DrinkGrid drinks={drinks} />
      </div>
    </section>
  );
}
