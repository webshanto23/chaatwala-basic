"use client"

import { useState } from "react"
import data from "../../../sitedata.json"
import { CategoryFilter } from "@/components/shared/CategoryFilter"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const categoryContent = data.home.featuredPicks

export function FeaturedPicks() {
  const [activeCategory, setActiveCategory] = useState("all")
  const selectedContent = categoryContent[activeCategory as keyof typeof categoryContent]

  return (
    <section className="bg-card px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 rounded-[2rem] border border-border/70 bg-background/80 p-6 shadow-sm sm:p-8 lg:p-10">
        <div className="flex flex-col items-center gap-3 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">Featured picks</p>
          <h2 className="text-2xl font-semibold text-foreground sm:text-3xl">{selectedContent.title}</h2>
          <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">{selectedContent.description}</p>
        </div>

        <div className="mx-auto flex w-full max-w-2xl justify-center rounded-full border border-border/60 bg-card/70 p-1.5 shadow-sm">
          <CategoryFilter activeCategory={activeCategory} onCategoryChange={setActiveCategory} />
        </div>

        {selectedContent.items.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {selectedContent.items.map((item) => (
              <Card key={item.name} className="h-full border-border/60 shadow-sm">
                <CardHeader>
                  <CardTitle>{item.name}</CardTitle>
                  <CardDescription>{item.detail}</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm font-semibold text-primary">Tk. {item.price}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border/70 bg-muted/40 p-6 text-center text-sm text-muted-foreground">
            Desserts are coming soon. We are preparing a sweet lineup for you.
          </div>
        )}
      </div>
    </section>
  )
}
