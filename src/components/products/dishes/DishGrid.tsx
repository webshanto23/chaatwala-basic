import { DishCard } from "./DishCard"

type Dish = {
  id: number
  name: string
  price: number
  image: string
}

export function DishGrid({ dishes }: { dishes: Dish[] }) {
  return (
    <div
      className="
        grid gap-4
        grid-cols-2        /* mobile */
        sm:grid-cols-2
        md:grid-cols-4     /* tablet */
        xl:grid-cols-6     /* large */
      "
    >
      {dishes.map((dish) => (
        <DishCard key={dish.id} dish={dish} />
      ))}
    </div>
  )
}