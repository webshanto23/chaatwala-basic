"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { Search } from "lucide-react"
import data from "../../../sitedata.json"
import { Button } from "@/components/ui/button"
import { Field } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

const searchableItems = data.search.items
const popularTags = ["Pani Puri", "Mango Lassi", "Chaat Combos"]

export function SearchBar() {
  const [query, setQuery] = useState("")

  const results = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return []

    return searchableItems.filter((item) => {
      return [item.label, item.description, item.category]
        .join(" ")
        .toLowerCase()
        .includes(term)
    })
  }, [query])

  return (
    <div className="flex flex-col items-center justify-center bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 px-4 py-8 sm:px-6 lg:px-8">
      <div className="w-full max-w-3xl">
        <div className="rounded-[2rem] border border-border/80 bg-white/90 p-6 shadow-xl shadow-primary/10 backdrop-blur-xl sm:p-8">
          <div className="mb-4 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-secondary">Good afternoon!</p>
            <h1 className="mt-3 text-3xl font-bold text-foreground sm:text-4xl">What would you like to eat today?</h1>
          </div>

          <Field orientation="horizontal" className="w-full rounded-full border border-border/70 bg-background shadow-sm">
            <Input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search chaat, drinks, combos..."
              className="flex-1 rounded-l-full border-none bg-transparent px-5 py-4 text-sm placeholder:text-muted-foreground focus-visible:ring-0"
            />
            <Button className="rounded-r-full px-6 py-4" type="button">
              <Search className="mr-2 h-4 w-4" />
              Search
            </Button>
          </Field>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-3 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Popular searches:</span>
            {popularTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setQuery(tag)}
                className="rounded-full border border-border/80 bg-muted/70 px-3 py-2 text-xs transition hover:bg-primary/10 hover:text-primary"
              >
                {tag}
              </button>
            ))}
          </div>

          {query.trim() && (
            <div className="mt-6 rounded-[1.5rem] border border-border/70 bg-background/95 p-4 shadow-sm">
              {results.length > 0 ? (
                <ul className="space-y-3">
                  {results.map((item) => (
                    <li key={item.label}>
                      <Link
                        href={item.href}
                        className="flex items-center justify-between rounded-3xl border border-border/60 bg-muted/30 px-4 py-3 transition hover:border-primary/50 hover:bg-primary/10"
                      >
                        <span>
                          <span className="block text-sm font-semibold text-foreground">{item.label}</span>
                          <span className="text-xs text-muted-foreground">{item.description}</span>
                        </span>
                        <span className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">
                          {item.category}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="px-2 py-3 text-sm text-muted-foreground">No matching items found.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}