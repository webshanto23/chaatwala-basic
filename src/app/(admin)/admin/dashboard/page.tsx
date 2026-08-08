export const revalidate = 60;

import prisma from "@/lib/prisma";
import { unstable_cache } from "next/cache";
import { MetricCard } from "@/components/shared/metric-card";
import { getUsers } from "@/app/actions/rbac";
import { getDishes, getDrinks } from "@/features/products/actions";
import { getOrders } from "@/app/actions/rbac";

export default async function AdminDashboardPage() {
  const [userCount, orderCount, dishCount, drinkCount, comboCount, revenueData] =
    await Promise.all([
      prisma.user.count(),
      prisma.order.count(),
      prisma.dish.count(),
      prisma.drink.count(),
      prisma.combo.count(),
      unstable_cache(
        async () => {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const [totalResult, todayResult] = await Promise.all([
            prisma.order.aggregate({ _sum: { total: true } }),
            prisma.order.aggregate({ where: { createdAt: { gte: today } }, _sum: { total: true } }),
          ]);
          return {
            totalEarnings: Number(totalResult._sum.total ?? 0),
            todayRevenue: Number(todayResult._sum.total ?? 0),
          };
        },
        ["admin-dashboard-revenue"],
        { revalidate: 60, tags: ["orders"] }
      )(),
    ]);

  const totalEarnings = revenueData.totalEarnings;
  const todayRevenue = revenueData.todayRevenue;
  const avgOrderValue = orderCount > 0 ? totalEarnings / orderCount : 0;

  await Promise.all([
    getUsers(),
    getDishes(),
    getDrinks(),
    getOrders({ limit: 50 }),
  ]);

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
