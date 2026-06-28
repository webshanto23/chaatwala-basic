import DataTable from "@/components/admin/data-table"

export default function CombosPage() {
  const columns = ["Name", "Items", "Price"]

  const data = [
    { name: "Snack Combo", items: "Pani Puri + Lassi", price: "180" },
    { name: "Mega Combo", items: "Bhel + Coffee", price: "200" },
  ]

  return (
    <div className="overflow-x-auto">
          <h1 className="text-2xl font-bold mb-4">Dishes</h1>
            <DataTable columns={columns} data={data} />
        </div>
  )
}