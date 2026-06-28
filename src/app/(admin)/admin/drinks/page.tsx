import DataTable from "@/components/admin/data-table"

export default function DrinksPage() {
  const columns = ["Name", "Price", "Size"]

  const data = [
    { name: "Lassi", price: "80", size: "Medium" },
    { name: "Cold Coffee", price: "120", size: "Large" },
  ]

  return (
    <div className="overflow-x-auto">
          <h1 className="text-2xl font-bold mb-4">Drinks</h1>
            <DataTable columns={columns} data={data} />
        </div>
  )
}