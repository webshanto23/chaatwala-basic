"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Minus } from "lucide-react"
import { useState } from "react"
import Image from "next/image"

type Dish = {
  id: number
  name: string
  price: number
  image: string
}

export function DishCard({ dish }: { dish: Dish }) {
  const [quantity, setQuantity] = useState(0)
  
  return (
    <Card className="rounded-xl overflow-hidden hover:shadow-lg hover:scale-105 transition-all duration-200 bg-card border-border">
      
      {/* Image */}
      <div className="aspect-square w-full overflow-hidden relative">
        <Image
          src={dish.image}
          alt={dish.name}
          width={300}
          height={300}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        <div className="absolute bottom-2 left-2 bg-white/90 dark:bg-black/80 rounded-full px-2 py-1">
          <span className="text-xs font-medium">⭐ 4.8</span>
        </div>
      </div>

      <CardContent className="p-3">
        
        {/* Title */}
        <h3 className="text-sm font-semibold line-clamp-1 text-foreground">
          {dish.name}
        </h3>

        {/* Price + Button */}
        <div className="flex items-center justify-between mt-2">
          <span className="text-sm font-medium text-primary">
            ৳{dish.price}
          </span>
          {quantity === 0 ? (
            <Button 
              size="sm" 
              className="h-7 px-3 text-xs rounded-full"
              onClick={() => setQuantity(1)}
            >
              <Plus className="w-3 h-3 mr-1" />
              Add
            </Button>
          ) : (
            <div className="flex items-center gap-1">
              <Button 
                size="sm" 
                variant="outline" 
                className="h-7 w-7 rounded-full p-0"
                onClick={() => setQuantity(prev => Math.max(0, prev - 1))}
              >
                <Minus className="w-3 h-3" />
              </Button>
              <span className="text-sm font-medium min-w-[1.5ch] text-center">{quantity}</span>
              <Button 
                size="sm" 
                className="h-7 w-7 rounded-full p-0"
                onClick={() => setQuantity(prev => prev + 1)}
              >
                <Plus className="w-3 h-3" />
              </Button>
            </div>
          )}
        </div>

      </CardContent>
    </Card>
  )
}