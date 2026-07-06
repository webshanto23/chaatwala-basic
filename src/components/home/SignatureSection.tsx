"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Minus } from "lucide-react"
import { useState } from "react"
import Image from "next/image"

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
    <section className="px-4 sm:px-6 lg:px-8 py-10 bg-gradient-to-br from-white via-secondary/5 to-primary/10">
      <div className="relative max-w-7xl mx-auto overflow-hidden rounded-[2rem] border border-border/70 bg-card/90 p-8 shadow-[0_32px_90px_-48px_rgba(245,158,11,0.25)]">
        <div className="pointer-events-none absolute -right-16 top-8 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute left-8 top-20 h-44 w-44 rounded-full bg-secondary/10 blur-3xl" />

        <div className="relative mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-secondary">Signature picks</p>
            <h2 className="mt-3 text-3xl font-bold text-foreground sm:text-4xl">{title}</h2>
          </div>
          <Button variant="ghost" size="sm" className="rounded-full border border-primary/15 bg-white/80 text-primary shadow-sm hover:bg-white">
            View All
          </Button>
        </div>

        <div className="flex gap-5 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide">
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
    <div className="flex-shrink-0 w-56 rounded-[2rem] border border-border/70 bg-gradient-to-br from-white to-primary/5 shadow-xl shadow-primary/10 transition-all duration-200 hover:-translate-y-1 hover:shadow-2xl snap-start">
      <div className="relative overflow-hidden rounded-[2rem] bg-muted/30">
        <div className="aspect-square w-full overflow-hidden">
          <Image
            src={item.image}
            alt={item.name}
            width={224}
            height={224}
            className="h-full w-full object-cover transition duration-500 hover:scale-105"
          />
        </div>
        {item.tag && (
          <Badge
            variant={item.tag}
            className="absolute top-3 right-3 rounded-full px-4 py-2 text-xs shadow-lg"
          >
            {item.tag === "spicy" ? "Spicy" : item.tag === "popular" ? "Popular" : "New"}
          </Badge>
        )}
        <div className="absolute bottom-3 left-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-foreground shadow-sm">
          ⭐ {item.rating}
        </div>
      </div>

      <div className="space-y-3 p-5">
        <h3 className="text-sm font-semibold text-foreground line-clamp-1">{item.name}</h3>
        <p className="text-lg font-bold text-primary">৳{item.price}</p>

        {quantity === 0 ? (
          <Button
            size="sm"
            className="w-full rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => setQuantity(1)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add
          </Button>
        ) : (
          <div className="flex items-center justify-between gap-2 rounded-full border border-border/70 bg-background/90 p-2">
            <Button
              size="sm"
              variant="outline"
              className="h-9 w-9 rounded-full p-0"
              onClick={() => setQuantity((prev) => Math.max(0, prev - 1))}
            >
              <Minus className="h-3 w-3" />
            </Button>
            <span className="font-medium text-sm">{quantity}</span>
            <Button
              size="sm"
              className="h-9 w-9 rounded-full p-0"
              onClick={() => setQuantity((prev) => prev + 1)}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}