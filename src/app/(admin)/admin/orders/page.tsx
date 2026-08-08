import { getOrders } from "@/app/actions/rbac";
import { OrdersClient } from "./OrdersClient";

export default async function OrdersPage() {
  const result = await getOrders({ limit: 50 });
  const orders = result.orders ?? [];

  return <OrdersClient initialOrders={orders} />;
}
