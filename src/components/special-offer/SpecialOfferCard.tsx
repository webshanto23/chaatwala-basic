import { Button } from "@/components/ui/button"

type Dish = {
  name: string
  price: number
  oldPrice: number
  image: string
}

export function SpecialOfferCard({ dish }: { dish: Dish }) {
  return (
    <div className="relative rounded-2xl overflow-hidden">
      
      {/* Image */}
      <div className="h-56 md:h-72 w-full">
        <img
          src={dish.image}
          alt={dish.name}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/20 flex flex-col justify-end p-4 text-white">
        
        {/* Badge */}
        <span className="bg-red-500 text-xs px-2 py-1 rounded w-fit mb-2">
         Today's Special Offer
        </span>

        {/* Title */}
        <h2 className="text-lg md:text-2xl font-bold">
          {dish.name}
        </h2>

        {/* Price */}
        <div className="flex items-center gap-2 mt-1">
          <span className="text-lg font-semibold">
            ৳{dish.price}
          </span>
          <span className="line-through text-sm text-gray-300">
            ৳{dish.oldPrice}
          </span>
        </div>

        {/* CTA */}
        <Button className="mt-3 w-fit">
          Order Now
        </Button>

      </div>
    </div>
  )
}