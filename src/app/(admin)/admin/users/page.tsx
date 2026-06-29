import DataTable from "@/components/admin/data-table"

export default function UsersPage() {
  const columns = ["Name", "Email", "Role"]

  const data = [
    { name: "John Doe", email: "john@mail.com", role: "Admin" },
    { name: "Jane Smith", email: "jane@mail.com", role: "User" },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl md:text-3xl font-bold text-foreground">Users</h1>
      <DataTable columns={columns} data={data} />
    </div>
  )
}