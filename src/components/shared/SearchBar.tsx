"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { Search } from "lucide-react"
import data from "../../../sitedata.json"
import { Button } from "@/components/ui/button"
import { Field } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

const searchableItems = data.search.items

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
    <div className="flex flex-col items-center justify-center bg-muted/30 px-4 py-6 dark:bg-muted/20 sm:px-6 lg:px-8">
      <h1 className="mb-1 text-2xl font-bold text-foreground">Good afternoon!</h1>
      <p className="mb-4 text-sm text-muted-foreground sm:text-base">
        What would you like to eat today?
      </p>

      <div className="w-full max-w-xl">
        <Field orientation="horizontal" className="w-full">
          <Input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search chaat, drinks, combos..."
            className="flex-1 rounded-r-none focus:ring-2 focus:ring-primary/50"
          />
          <Button className="rounded-l-none px-6" type="button">
            <Search className="mr-2 h-4 w-4" />
            Search
          </Button>
        </Field>

        {query.trim() && (
          <div className="mt-3 rounded-2xl border border-border/70 bg-background/95 p-3 shadow-sm">
            {results.length > 0 ? (
              <ul className="space-y-2">
                {results.map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className="flex items-center justify-between rounded-xl px-3 py-2 transition-colors hover:bg-muted"
                    >
                      <span>
                        <span className="block text-sm font-medium text-foreground">{item.label}</span>
                        <span className="text-xs text-muted-foreground">{item.description}</span>
                      </span>
                      <span className="text-xs font-medium uppercase tracking-[0.2em] text-primary">
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
  )
}