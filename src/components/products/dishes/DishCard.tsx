import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

type Dish = {
  id: number
  name: string
  price: number
  image: string
}

export function DishCard({ dish }: { dish: Dish }) {
  return (
    <Card className="rounded-xl overflow-hidden hover:shadow-md transition">
      
      {/* Image */}
      <div className="aspect-square w-full overflow-hidden">
        <img
          src={dish.image}
          alt={dish.name}
          className="w-full h-full object-cover px-2 rounded-xl"
        />
      </div>

      <CardContent className="p-3">
        
        {/* Title */}
        <h3 className="text-sm font-semibold line-clamp-1">
          {dish.name}
        </h3>

        {/* Price + Button */}
        <div className="flex items-center justify-between mt-2">
          <span className="text-sm font-medium">
            ৳{dish.price}
          </span>
          <Button size="sm" className="h-7 px-3 text-xs">
            Add
          </Button>
        </div>

      </CardContent>
    </Card>
  )
}