"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Minus } from "lucide-react"
import { useState } from "react"

type FoodItem = {
  id: number
  name: string
  price: number
  image: string
  rating: number
  tag?: "spicy" | "popular" | "new"
}

interface SignatureSectionProps {
  title: string
  items: FoodItem[]
  color?: "primary" | "secondary" | "accent"
}

export function SignatureSection({ title, items }: SignatureSectionProps) {
  return (
    <section className="px-4 sm:px-6 lg:px-8 py-8 bg-card">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl md:text-2xl font-bold text-foreground">{title}</h2>
          <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
            View All
          </Button>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide">
          {items.map((item) => (
            <FoodCard key={item.id} item={item} />
          ))}
        </div>
      </div>
    </section>
  )
}

function FoodCard({ item }: { item: FoodItem }) {
  const [quantity, setQuantity] = useState(0)

  return (
    <div className="flex-shrink-0 w-48 sm:w-56 bg-background rounded-2xl overflow-hidden shadow-md hover:shadow-xl hover:scale-105 transition-all duration-200 snap-start">
      <div className="relative">
        <div className="aspect-square w-full overflow-hidden">
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-full object-cover"
          />
        </div>
        {item.tag && (
          <Badge 
            variant={item.tag} 
            className="absolute top-2 right-2 text-xs shadow-lg"
          >
            {item.tag === "spicy" ? "Spicy" : item.tag === "popular" ? "Popular" : "New"}
          </Badge>
        )}
        <div className="absolute bottom-2 left-2 bg-white/90 dark:bg-black/80 rounded-full px-2 py-1">
          <span className="text-xs font-medium">⭐ {item.rating}</span>
        </div>
      </div>

      <div className="p-3 space-y-2">
        <h3 className="font-semibold text-sm line-clamp-1 text-foreground">{item.name}</h3>
        <p className="text-primary font-bold text-sm">৳{item.price}</p>

        {quantity === 0 ? (
          <Button 
            size="sm" 
            className="w-full h-8 rounded-full"
            onClick={() => setQuantity(1)}
          >
            <Plus className="w-4 h-4 mr-1" />
            Add
          </Button>
        ) : (
          <div className="flex items-center justify-center gap-2">
            <Button 
              size="sm" 
              variant="outline" 
              className="h-8 w-8 rounded-full p-0"
              onClick={() => setQuantity(prev => Math.max(0, prev - 1))}
            >
              <Minus className="w-3 h-3" />
            </Button>
            <span className="font-medium text-sm min-w-[2ch] text-center">{quantity}</span>
            <Button 
              size="sm" 
              className="h-8 w-8 rounded-full p-0"
              onClick={() => setQuantity(prev => prev + 1)}
            >
              <Plus className="w-3 h-3" />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}