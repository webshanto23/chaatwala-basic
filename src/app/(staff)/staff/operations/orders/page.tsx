import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/authorize";
import { getOrders } from "@/app/actions/rbac";
import { OrdersClient } from "@/features/staff-ui/orders/OrdersClient";

export const revalidate = 300;

export default async function StaffOrdersPage() {
  if (!(await requirePermission("order:view")).authorized) redirect("/access-denied");
  const result = await getOrders({ limit: 20 });
  return <OrdersClient initialOrders={result.orders ?? []} initialNextCursor={result.nextCursor ?? null} />;
}
