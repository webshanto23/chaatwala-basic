import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { unstable_cache, revalidateTag } from "next/cache";

export async function getOrders() {
  const session = await auth();
  if (!session?.user?.id) return [];

  const userId = session.user.id;

  return unstable_cache(
    async () => {
      const orders = await prisma.order.findMany({
        where: { userId },
        include: { items: true },
        orderBy: { createdAt: "desc" },
      });
      return orders.map((order) => ({
        ...order,
        createdAt: order.createdAt.toISOString(),
        items: order.items.map((item) => ({
          ...item,
          createdAt: item.createdAt.toISOString(),
        })),
      }));
    },
    ["user-orders", userId],
    { revalidate: 300, tags: ["user-orders"] }
  )();
}

export async function getOrderById(id: string) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const userId = session.user.id;

  return unstable_cache(
    async () => {
      const order = await prisma.order.findFirst({
        where: { id, userId },
        include: { items: true },
      });
      if (!order) return null;
      return {
        ...order,
        createdAt: order.createdAt.toISOString(),
        items: order.items.map((item) => ({
          ...item,
          createdAt: item.createdAt.toISOString(),
        })),
      };
    },
    ["user-order", id, userId],
    { revalidate: 300, tags: ["user-orders"] }
  )();
}

export async function createOrder(addressId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const cart = await prisma.cart.findFirst({
    where: { userId: session.user.id },
    include: { items: true },
  });

  if (!cart || cart.items.length === 0) {
    throw new Error("Cart is empty");
  }

  const subtotal = cart.items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
  const deliveryFee = 50;
  const total = subtotal + deliveryFee;

  const order = await prisma.order.create({
    data: {
      userId: session.user.id,
      addressId,
      subtotal,
      deliveryFee,
      total,
      status: "pending_payment",
      items: {
        create: cart.items.map(item => ({
          productId: item.productId,
          productType: item.productType,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          imageUrl: item.imageUrl,
        })),
      },
    },
    include: { items: true },
  });

  await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });

  revalidateTag("user-orders");

  return order;
}
