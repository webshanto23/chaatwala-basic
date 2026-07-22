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
    <section className="px-4 py-10 sm:px-6 lg:px-8 bg-gradient-to-br from-secondary/5 via-background to-primary/10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 rounded-[2rem] border border-border/60 bg-card/90 p-8 shadow-[0_32px_120px_-70px_rgba(59,130,246,0.25)] backdrop-blur-xl">
          <div className="space-y-4 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-secondary">Featured picks</p>
            <h2 className="text-3xl font-bold text-foreground sm:text-4xl">{selectedContent.title}</h2>
            <p className="mx-auto max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
              {selectedContent.description}
            </p>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 rounded-full border border-border/70 bg-card/60 p-1.5 shadow-sm">
            <CategoryFilter activeCategory={activeCategory} onCategoryChange={setActiveCategory} />
          </div>
        </div>

        {selectedContent.items.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {selectedContent.items.map((item) => (
              <Card key={item.name} className="h-full overflow-hidden rounded-[1.75rem] border-0 bg-gradient-to-br from-card via-secondary/10 to-card shadow-lg shadow-secondary/10">
                <CardHeader className="px-6 pt-6 pb-4">
                  <CardTitle>{item.name}</CardTitle>
                  <CardDescription>{item.detail}</CardDescription>
                </CardHeader>
                <CardContent className="border-t border-border/50 px-6 py-5">
                  <p className="text-sm font-semibold text-primary">Tk. {item.price}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-border/70 bg-muted/40 p-8 text-center text-sm text-muted-foreground">
            Desserts are coming soon. We are preparing a sweet lineup for you.
          </div>
        )}
      </div>
    </section>
  )
}
