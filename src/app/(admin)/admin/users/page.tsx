"use client"

import { useState } from "react"
import data from "../../../../../sitedata.json"
import DataTable from "@/components/admin/data-table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Plus } from "lucide-react"

export default function UsersPage() {
  const columns = ["Name", "Email", "Role"]
  const rows = data.admin.tables.users
  const [query, setQuery] = useState("")

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
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Users</h1>
        <div className="flex items-center gap-3">
          <Input
            placeholder="Search users..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="max-w-xs"
            data-testid="admin-search"
          />
          <Button asChild>
            <a href="#" className="inline-flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New User
            </a>
          </Button>
        </div>
      </div>

      <DataTable columns={columns} data={rows} showActions onEdit={handleEdit} onDelete={handleDelete} filter={query} />
    </div>
  )
}