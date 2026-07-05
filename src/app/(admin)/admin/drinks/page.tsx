import data from "../../../../../sitedata.json"
import DataTable from "@/components/admin/data-table"

export default function DrinksPage() {
  const columns = ["Name", "Price", "Size"]
  const rows = data.admin.tables.drinks

  return (
    <div className="space-y-6">
      <h1 className="text-2xl md:text-3xl font-bold text-foreground">Drinks</h1>
      <DataTable columns={columns} data={rows} />
    </div>
  )
}