import { getOrders } from "@/features/orders/service";
import { OrdersList } from "@/components/orders/OrdersList";

export default async function OrdersPage() {
  const orders = await getOrders();

  return (
    <OrdersList
      orders={orders.map((order) => ({
        id: order.id,
        status: order.status,
        subtotal: Number(order.subtotal),
        deliveryFee: Number(order.deliveryFee),
        total: Number(order.total),
        paymentStatus: order.paymentStatus,
        sslTxnId: order.sslTxnId,
        items: order.items.map((item) => ({
          id: item.id,
          productId: item.productId,
          productType: item.productType,
          name: item.name,
          price: Number(item.price),
          quantity: item.quantity,
          imageUrl: item.imageUrl,
          createdAt: item.createdAt.toISOString(),
        })),
        createdAt: order.createdAt.toISOString(),
      }))}
      loading={false}
      error={null}
    />
  );
}
