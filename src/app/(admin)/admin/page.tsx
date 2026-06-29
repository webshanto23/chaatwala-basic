import { MetricCard } from "@/components/shared/metric-card"

export default function DashboardPage() {
  // 👉 Replace with API later
  const data = {
    users: 1240,
    visitors: 5421,
    dishes: 86,
    drinks: 34,
    combos: 12,
    orders: 920,
    deliveries: 870,
    earnings: 12500,
    todayRevenue: 540,
    avgOrder: 13.5,
    topItem: "Pani Puri",
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl md:text-3xl font-bold text-foreground">Welcome Admin 👋</h1>
      <p className="text-muted-foreground">
        Manage your food platform here.
      </p>
      {/* ✅ Grid */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">

        <MetricCard title="Total Users" value={data.users} />
        <MetricCard title="Visitors" value={data.visitors} />
        <MetricCard title="Total Orders" value={data.orders} />
        <MetricCard title="Deliveries" value={data.deliveries} />

        <MetricCard title="Dishes" value={data.dishes} />
        <MetricCard title="Drinks" value={data.drinks} />
        <MetricCard title="Combos" value={data.combos} />
        <MetricCard title="Top Item" value={data.topItem} />

        <MetricCard title="Total Earnings" value={`$${data.earnings}`} />
        <MetricCard title="Today's Revenue" value={`$${data.todayRevenue}`} />
        <MetricCard title="Avg Order Value" value={`$${data.avgOrder}`} />
      </div>
    </div>
  )
}