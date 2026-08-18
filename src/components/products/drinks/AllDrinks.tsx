import { getAllDrinks } from "@/features/products/service";
import { DrinkGrid } from "./DrinkGrid";

export async function AllDrinks() {
  const alldrinks = await getAllDrinks();

  const drinks = alldrinks.map((drink) => ({
    id: drink.id,
    name: drink.name,
    detail: drink.description ?? "",
    price: drink.discountPrice ? Number(drink.discountPrice) : Number(drink.price),
    originalPrice: Number(drink.price),
    discountPrice: drink.discountPrice ? Number(drink.discountPrice) : null,
    image: drink.imageUrl ?? "",
  }));

  return (
    <section className="px-4 py-10 md:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 rounded-[2rem] border border-border/70 bg-card/90 p-8 text-center shadow-[0_32px_120px_-70px_rgba(59,130,246,0.25)] backdrop-blur-xl">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">
            All Drinks
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Explore our full menu
          </p>
        </div>
        <DrinkGrid drinks={drinks} />
      </div>
    </section>
  );
}
