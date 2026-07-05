import data from "../../../../../sitedata.json"
import DataTable from "@/components/admin/data-table"

export default function UsersPage() {
  const columns = ["Name", "Email", "Role"]
  const rows = data.admin.tables.users

  return (
    <div className="space-y-6">
      <h1 className="text-2xl md:text-3xl font-bold text-foreground">Users</h1>
      <DataTable columns={columns} data={rows} />
    </div>
  )
}