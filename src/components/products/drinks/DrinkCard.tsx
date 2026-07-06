"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Minus } from "lucide-react"
import { useState } from "react"
import Image from "next/image"

type Drink = {
  id: number
  name: string
  detail: string
  price: number
  image: string
}

export function DrinkCard({ drink }: { drink: Drink }) {
  const [quantity, setQuantity] = useState(0)

  return (
    <Card className="group rounded-[2rem] overflow-hidden border-0 bg-gradient-to-br from-white via-primary/10 to-white shadow-lg shadow-primary/10 transition-all duration-200 hover:-translate-y-1 hover:shadow-2xl">
      <div className="relative overflow-hidden">
        <div className="aspect-square w-full overflow-hidden">
          <Image
            src={drink.image}
            alt={drink.name}
            width={300}
            height={300}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        </div>
        <div className="absolute bottom-3 left-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-foreground shadow-sm">
          Drink Special
        </div>
      </div>

      <CardContent className="p-5 space-y-4">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold line-clamp-1 text-foreground">{drink.name}</h3>
          <p className="text-xs text-muted-foreground">{drink.detail}</p>
        </div>

        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-semibold text-primary">৳{drink.price}</span>
          {quantity === 0 ? (
            <Button
              size="sm"
              className="h-9 rounded-full bg-primary px-4 text-primary-foreground hover:bg-primary/90"
              onClick={() => setQuantity(1)}
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Add
            </Button>
          ) : (
            <div className="flex items-center gap-2 rounded-full border border-border/70 bg-background/90 p-1">
              <Button
                size="sm"
                variant="outline"
                className="h-9 w-9 rounded-full p-0"
                onClick={() => setQuantity((prev) => Math.max(0, prev - 1))}
              >
                <Minus className="w-3 h-3" />
              </Button>
              <span className="text-sm font-medium min-w-[1.5ch] text-center">{quantity}</span>
              <Button
                size="sm"
                className="h-9 w-9 rounded-full p-0 bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={() => setQuantity((prev) => prev + 1)}
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
