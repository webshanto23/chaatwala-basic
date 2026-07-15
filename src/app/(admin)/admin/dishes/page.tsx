"use client"

import { useEffect, useState } from "react"
import { getDishes } from "@/app/actions/rbac"
import DataTable from "@/components/admin/data-table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

type DishRow = {
  id: string
  name: string
  price: string
  category: string
  [key: string]: unknown
}

export default function DishesPage() {
  const columns = ["Name", "Price", "Category"]
  const [rows, setRows] = useState<DishRow[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState("")

  useEffect(() => {
    let active = true
    ;(async () => {
      const result = await getDishes()
      if (!active) return
      if (!("error" in result) && result.dishes) {
        setRows(
          result.dishes.map((dish) => ({
            id: dish.id,
            name: dish.name,
            price: String(dish.price),
            category: dish.tag ?? "-",
          }))
        )
      }
      setLoading(false)
    })()
    return () => {
      active = false
    }
  }, [])

  const handleEdit = (row: Record<string, unknown>) => {
    alert(`Edit ${row.name}`)
  }

  const handleDelete = (row: Record<string, unknown>) => {
    if (confirm(`Delete ${row.name}?`)) {
      alert(`Deleted ${row.name}`)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Dishes</h1>
        <div className="flex items-center gap-3">
          <Input
            placeholder="Search dishes..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="max-w-xs"
            data-testid="admin-search"
          />
          <Button asChild>
            <a href="#" className="inline-flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New Dish
            </a>
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="rounded-lg border border-border bg-card p-6 text-center text-muted-foreground">
          Loading dishes...
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={rows}
          showActions
          onEdit={handleEdit}
          onDelete={handleDelete}
          filter={query}
        />
      )}
    </div>
  )
}
