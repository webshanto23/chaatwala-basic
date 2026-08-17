import { getOrders } from "@/app/actions/rbac";
import { OrdersClient } from "./OrdersClient";

export const revalidate = 300;

export default async function OrdersPage() {
  const result = await getOrders({ limit: 20 });
  const orders = result.orders ?? [];

  return <OrdersClient initialOrders={orders} initialNextCursor={result.nextCursor} />;
}
