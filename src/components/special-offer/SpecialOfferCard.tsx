import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

type Dish = {
  name: string
  price: number
  oldPrice: number
  image: string
}

export function SpecialOfferCard({ dish }: { dish: Dish }) {
  return (
    <div className="relative rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 group">
      
      {/* Image */}
      <div className="h-56 md:h-72 w-full">
        <img
          src={dish.image}
          alt={dish.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      </div>

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/60 to-transparent flex flex-col justify-end p-4 md:p-6 text-white">
        
        {/* Badge */}
        <Badge variant="default" className="w-fit mb-2 bg-secondary text-secondary-foreground font-semibold shadow-lg">
         Today&apos;s Special Offer
        </Badge>

        {/* Title */}
        <h2 className="text-lg md:text-2xl font-bold drop-shadow-sm">
          {dish.name}
        </h2>

        {/* Price */}
        <div className="flex items-center gap-2 mt-1">
          <span className="text-lg font-semibold">
            ৳{dish.price}
          </span>
          <span className="line-through text-sm text-white/70">
            ৳{dish.oldPrice}
          </span>
        </div>

        {/* CTA */}
        <Button className="mt-3 w-fit bg-secondary hover:bg-secondary/90 text-secondary-foreground font-semibold shadow-lg hover:scale-105 transition-transform">
          Order Now
        </Button>

      </div>
    </div>
  )
}