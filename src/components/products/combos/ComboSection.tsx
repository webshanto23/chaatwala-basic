"use client"

import data from "../../../../sitedata.json"
import { ComboCard } from "./ComboCard"
import { Button } from "@/components/ui/button"

const combos = data.products.combos

export function ComboSection() {
  return (
    <section className="px-4 py-10 sm:px-6 lg:px-8 bg-gradient-to-br from-secondary/5 via-background to-primary/10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 rounded-[2rem] border border-border/70 bg-white/90 p-8 shadow-[0_32px_120px_-70px_rgba(59,130,246,0.25)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-secondary">Meal bundles</p>
              <h2 className="mt-2 text-3xl font-bold text-foreground">Combo meals to share</h2>
            </div>
            <p className="max-w-xl text-sm text-muted-foreground">
              Enjoy quick, balanced combos for every craving.
            </p>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {combos.map((combo) => (
            <ComboCard key={combo.id} combo={combo} />
          ))}
        </div>
      </div>
    </section>
  )
}