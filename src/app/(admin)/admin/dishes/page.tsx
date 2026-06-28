import DataTable from "@/components/admin/data-table"

export default function DishesPage() {
  const columns = ["Name", "Price", "Category"]

  const data = [
    { name: "Pani Puri", price: "120", category: "Snacks" },
    { name: "Bhel Puri", price: "100", category: "Snacks" },
  ]

  return (


    <div className="overflow-x-auto">
      <h1 className="text-2xl font-bold mb-4">Dishes</h1>
      <DataTable columns={columns} data={data} />
    </div>
  )
}