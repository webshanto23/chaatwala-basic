"use client"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const categories = [
  { id: "all", label: "All" },
  { id: "chaat", label: "Chaat" },
  { id: "drinks", label: "Drinks" },
  { id: "combos", label: "Combos" },
  { id: "desserts", label: "Desserts" },
]

export function CategoryFilter() {
  return (
    <div className="sticky top-0 z-40 bg-card/95 backdrop-blur-sm border-b py-3 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {categories.map((category) => (
            <Button
              key={category.id}
              variant="ghost"
              size="sm"
              className={cn(
                "rounded-full whitespace-nowrap transition-all duration-200",
                "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground",
                "hover:bg-muted"
              )}
              data-state={category.id === "all" ? "active" : undefined}
            >
              {category.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}