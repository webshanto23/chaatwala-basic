"use client"

import { cn } from "@/lib/utils"

const categories = [
  { id: "all", label: "All" },
  { id: "chaat", label: "Chaat" },
  { id: "drinks", label: "Drinks" },
  { id: "combos", label: "Combos" },
  { id: "desserts", label: "Desserts" },
]

type CategoryFilterProps = {
  activeCategory?: string
  onCategoryChange?: (category: string) => void
}

export function CategoryFilter({ activeCategory = "all", onCategoryChange }: CategoryFilterProps) {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {categories.map((category) => {
        const isActive = activeCategory === category.id

        return (
          <button
            key={category.id}
            type="button"
            onClick={() => onCategoryChange?.(category.id)}
            className={cn(
              "whitespace-nowrap rounded-full px-3 py-2 text-sm font-medium transition-all duration-200",
              isActive
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {category.label}
          </button>
        )
      })}
    </div>
  )
}