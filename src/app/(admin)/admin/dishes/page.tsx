import data from "../../../../../sitedata.json"
import DataTable from "@/components/admin/data-table"

export default function DishesPage() {
  const columns = ["Name", "Price", "Category"]
  const rows = data.admin.tables.dishes

  return (
    <div className="space-y-6">
      <h1 className="text-2xl md:text-3xl font-bold text-foreground">Dishes</h1>
      <DataTable columns={columns} data={rows} />
    </div>
  )
}