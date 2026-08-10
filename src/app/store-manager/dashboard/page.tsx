export const revalidate = 120;

import { getStoreDashboardStats } from "@/features/store-manager/actions";
import { DashboardClient } from "./DashboardClient";

export default async function StoreManagerDashboardPage() {
  const result = await getStoreDashboardStats();
  const stats = "stats" in result ? result.stats : undefined;

  return <DashboardClient initialStats={stats ?? {
    totalOrders: 0,
    pendingOrders: 0,
    cancelledOrders: 0,
    deliveredOrders: 0,
    dishCount: 0,
    drinkCount: 0,
    comboCount: 0,
    totalEarnings: 0,
    todayRevenue: 0,
    avgOrderValue: 0,
  }} />;
}
