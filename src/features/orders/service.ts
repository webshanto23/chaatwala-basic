import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function getOrders() {
  const session = await auth();
  if (!session?.user?.id) return [];

  return prisma.order.findMany({
    where: { userId: session.user.id },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getOrderById(id: string) {
  const session = await auth();
  if (!session?.user?.id) return null;

  return prisma.order.findFirst({
    where: { id, userId: session.user.id },
    include: { items: true },
  });
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

  return order;
}
