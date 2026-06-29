"use client"

import { ComboCard } from "./ComboCard"
import { Button } from "@/components/ui/button"

const combos = [
  {
    id: 1,
    name: "Chaat Lover Combo",
    items: ["Pani Puri", "Bhel Puri", "Dahi Puri"],
    price: 299,
    originalPrice: 399,
    image: "https://images.unsplash.com/photo-1603133872878-684f208fb84b"
  },
  {
    id: 2,
    name: "Meal Deal",
    items: ["Chicken Biryani", "Raita", "Salad"],
    price: 349,
    originalPrice: 449,
    image: "https://images.unsplash.com/photo-1627308595229-7830a5c91f9f"
  },
  {
    id: 3,
    name: "Snack Pack",
    items: ["Singara Chaat", "Aloo Tikki", "Thums Up"],
    price: 199,
    originalPrice: 249,
    image: "https://images.unsplash.com/photo-1600891964599-f61ba0e24092"
  },
  {
    id: 4,
    name: "Family Feast",
    items: ["Veg Biryani", "Paneer Tikka", "Naan", "Raita"],
    price: 599,
    originalPrice: 799,
    image: "https://images.unsplash.com/photo-1600891964599-f61ba0e24092"
  }
]

export function ComboSection() {
  return (
    <section className="px-4 sm:px-6 lg:px-8 py-12 bg-muted/20 dark:bg-muted">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">
            Combo Deals
          </h2>
          <Button variant="ghost" className="text-primary hover:text-primary/80">
            View All
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {combos.map((combo) => (
            <ComboCard key={combo.id} combo={combo} />
          ))}
        </div>
      </div>
    </section>
  )
}