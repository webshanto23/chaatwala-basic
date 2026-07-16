import { DrinkCard } from "./DrinkCard"

type Drink = {
  id: string
  name: string
  detail: string
  price: number | string
  image: string
}

export function DrinkGrid({ drinks }: { drinks: Drink[] }) {
  return (
    <div className="grid gap-4 grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6"
    >
      {drinks.map((drink) => (
        <DrinkCard key={drink.id} drink={drink} />
      ))}
    </div>
  )
}
