import { PopularDrinks } from "./PopularDrinks"
import { AllDrinks } from "./AllDrinks"

export function DrinksSection() {
  return (
    <div className="flex flex-1 flex-col bg-background font-sans">
      <PopularDrinks />
      <AllDrinks />
    </div>
  )
}
