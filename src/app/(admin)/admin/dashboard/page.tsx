import data from "../../../../../sitedata.json";
import { MetricCard } from "@/components/shared/metric-card";

export default function AdminDashboardPage() {
  const stats = data.admin.dashboardStats;
  /**
   * TODO: Implement Admin Name Fetch from DB
   * */

  return (
    <div className="space-y-6">
      <h1 className="text-2xl md:text-3xl font-bold text-foreground">
        Welcome Admin 👋
      </h1>
      <p className="text-muted-foreground">Manage your food platform here.</p>
      {/* ✅ Grid */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Total Users" value={stats.users} />
        <MetricCard title="Visitors" value={stats.visitors} />
        <MetricCard title="Total Orders" value={stats.orders} />
        <MetricCard title="Deliveries" value={stats.deliveries} />

        <MetricCard title="Dishes" value={stats.dishes} />
        <MetricCard title="Drinks" value={stats.drinks} />
        <MetricCard title="Combos" value={stats.combos} />
        <MetricCard title="Top Item" value={stats.topItem} />

        <MetricCard title="Total Earnings" value={`$${stats.earnings}`} />
        <MetricCard title="Today's Revenue" value={`$${stats.todayRevenue}`} />
        <MetricCard title="Avg Order Value" value={`$${stats.avgOrder}`} />
      </div>
    </div>
  );
}
