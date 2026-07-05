"use client"

import data from "../../../../sitedata.json"
import { ComboCard } from "./ComboCard"
import { Button } from "@/components/ui/button"

const combos = data.products.combos

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