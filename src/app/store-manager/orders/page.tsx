import { getStoreOrders } from "@/features/store-manager/actions";
import { OrdersClient } from "./OrdersClient";

export default async function StoreManagerOrdersPage() {
  const result = await getStoreOrders({ limit: 25 });
  const orders = "orders" in result ? result.orders : [];
  const nextCursor = "nextCursor" in result ? result.nextCursor : null;

  return <OrdersClient initialOrders={orders} initialNextCursor={nextCursor} />;
}
