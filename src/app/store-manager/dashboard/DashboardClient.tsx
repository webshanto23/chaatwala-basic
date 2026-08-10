"use client";

import { MetricCard } from "@/components/shared/metric-card";

type Stats = {
  totalOrders: number;
  pendingOrders: number;
  cancelledOrders: number;
  deliveredOrders: number;
  dishCount: number;
  drinkCount: number;
  comboCount: number;
  totalEarnings: number;
  todayRevenue: number;
  avgOrderValue: number;
};

export function DashboardClient({ initialStats }: { initialStats: Stats }) {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl md:text-3xl font-bold text-foreground">Dashboard</h1>
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Total Orders" value={initialStats.totalOrders} />
        <MetricCard title="Pending Orders" value={initialStats.pendingOrders} />
        <MetricCard title="Cancelled Orders" value={initialStats.cancelledOrders} />
        <MetricCard title="Delivered Orders" value={initialStats.deliveredOrders} />
        <MetricCard title="Total Dishes" value={initialStats.dishCount} />
        <MetricCard title="Total Drinks" value={initialStats.drinkCount} />
        <MetricCard title="Combos" value={initialStats.comboCount} />
        <MetricCard title="Total Earnings" value={`৳${initialStats.totalEarnings.toFixed(2)}`} />
        <MetricCard title="Today's Revenue" value={`৳${initialStats.todayRevenue.toFixed(2)}`} />
        <MetricCard title="Avg Order Value" value={`৳${initialStats.avgOrderValue.toFixed(2)}`} />
      </div>
    </div>
  );
}
