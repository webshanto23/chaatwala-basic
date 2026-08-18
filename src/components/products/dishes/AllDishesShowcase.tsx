import { getAllDishes } from "@/features/products/service";
import { DishGrid } from "./DishGrid";

export async function AllDishesShowcase() {
  const alldishes = await getAllDishes();

  const dishes = alldishes.map((dish) => ({
    id: dish.id,
    name: dish.name,
    price: dish.discountPrice ? Number(dish.discountPrice) : Number(dish.price),
    originalPrice: Number(dish.price),
    discountPrice: dish.discountPrice ? Number(dish.discountPrice) : null,
    detail: dish.description ?? "",
    image: dish.imageUrl ?? "",
  }));

  return (
    <section className="px-4 py-10 md:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 rounded-[2rem] border border-border/70 bg-card/90 p-8 text-center shadow-[0_32px_120px_-70px_rgba(59,130,246,0.25)] backdrop-blur-xl">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">
            All Dishes
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Explore our full menu
          </p>
        </div>
        <DishGrid dishes={dishes} />
      </div>
    </section>
  );
}
