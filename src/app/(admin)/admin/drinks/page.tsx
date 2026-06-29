import DataTable from "@/components/admin/data-table"

export default function DrinksPage() {
  const columns = ["Name", "Price", "Size"]

  const data = [
    { name: "Lassi", price: "80", size: "Medium" },
    { name: "Cold Coffee", price: "120", size: "Large" },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl md:text-3xl font-bold text-foreground">Drinks</h1>
      <DataTable columns={columns} data={data} />
    </div>
  )
}