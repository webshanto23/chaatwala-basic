import prisma from "@/lib/prisma";
import { MetricCard } from "@/components/shared/metric-card";

export default async function AdminDashboardPage() {
  const [userCount, orderCount, dishCount, drinkCount, comboCount] =
    await Promise.all([
      prisma.user.count(),
      prisma.order.count(),
      prisma.dish.count(),
      prisma.drink.count(),
      prisma.combo.count(),
    ]);

  const orders = await prisma.order.findMany({
    select: { total: true, createdAt: true },
  });

  const totalEarnings = orders.reduce(
    (sum, order) => sum + Number(order.total),
    0,
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayRevenue = orders
    .filter((order) => order.createdAt >= today)
    .reduce((sum, order) => sum + Number(order.total), 0);

  const avgOrderValue = orderCount > 0 ? totalEarnings / orderCount : 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl md:text-3xl font-bold text-foreground">
        Welcome Admin 👋
      </h1>
      <p className="text-muted-foreground">Manage your food platform here.</p>
      {/* ✅ Grid */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Total Users" value={userCount} />
        <MetricCard title="Total Orders" value={orderCount} />
        <MetricCard title="Deliveries" value={orderCount} />
        <MetricCard title="Dishes" value={dishCount} />
        <MetricCard title="Drinks" value={drinkCount} />
        <MetricCard title="Combos" value={comboCount} />
        <MetricCard
          title="Total Earnings"
          value={`৳${totalEarnings.toFixed(2)}`}
        />
        <MetricCard
          title="Today's Revenue"
          value={`৳${todayRevenue.toFixed(2)}`}
        />
        <MetricCard
          title="Avg Order Value"
          value={`৳${avgOrderValue.toFixed(2)}`}
        />
      </div>
    </div>
  );
}
