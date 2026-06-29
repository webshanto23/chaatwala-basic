"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus } from "lucide-react"
import Image from "next/image"

type Combo = {
  id: number
  name: string
  items: string[]
  price: number
  originalPrice: number
  image: string
}

export function ComboCard({ combo }: { combo: Combo }) {
  const discount = Math.round((1 - combo.price / combo.originalPrice) * 100)

  return (
    <Card className="rounded-2xl overflow-hidden hover:shadow-xl hover:scale-105 transition-all duration-300 bg-card border-border">
      <div className="relative">
        <div className="aspect-video w-full overflow-hidden">
          <Image
            src={combo.image}
            alt={combo.name}
            width={400}
            height={224}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
        </div>
        
        <Badge variant="popular" className="absolute top-3 right-3 shadow-lg">
          {discount}% Off
        </Badge>
      </div>

      <CardContent className="p-4 space-y-3">
        <h3 className="font-bold text-lg text-foreground">{combo.name}</h3>
        
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Includes:</p>
          <ul className="text-sm space-y-0.5">
            {combo.items.map((item, i) => (
              <li key={i} className="flex items-center gap-2">
                <span className="w-1 h-1 bg-primary rounded-full" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex items-end justify-between pt-2">
          <div>
            <span className="text-sm text-muted-foreground line-through">৳{combo.originalPrice}</span>
            <p className="text-xl font-bold text-primary">৳{combo.price}</p>
          </div>
          <Button size="sm" className="rounded-full">
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}