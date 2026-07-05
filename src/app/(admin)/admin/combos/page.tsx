import data from "../../../../../sitedata.json"
import DataTable from "@/components/admin/data-table"

export default function CombosPage() {
  const columns = ["Name", "Items", "Price"]
  const rows = data.admin.tables.combos

  return (
    <div className="space-y-6">
      <h1 className="text-2xl md:text-3xl font-bold text-foreground">Combos</h1>
      <DataTable columns={columns} data={rows} />
    </div>
  )
}