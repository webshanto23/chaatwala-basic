import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(request: Request) {
  const session = await auth();
  const body = await request.json().catch(() => ({}));
  const { addressId } = body as { addressId?: string };

  if (!addressId) {
    return NextResponse.json({ error: "addressId is required" }, { status: 400 });
  }

  const userId = session?.user?.id;

  let cart;
  if (userId) {
    cart = await prisma.cart.findFirst({
      where: { userId },
      include: { items: true },
    });
  } else {
    return NextResponse.json({ error: "Please sign in to checkout" }, { status: 401 });
  }

  if (!cart || cart.items.length === 0) {
    return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
  }

  const address = await prisma.address.findFirst({
    where: { id: addressId, userId: userId ?? undefined },
  });

  if (!address) {
    return NextResponse.json({ error: "Address not found" }, { status: 404 });
  }

  const subtotal = cart.items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
  const deliveryFee = 50;
  const total = subtotal + deliveryFee;

  const order = await prisma.order.create({
    data: {
      userId: userId ?? undefined,
      addressId: address.id,
      subtotal,
      deliveryFee,
      total,
      items: {
        create: cart.items.map((item) => ({
          productId: item.productId,
          productType: item.productType,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          imageUrl: item.imageUrl,
        })),
      },
    },
    include: {
      items: true,
      address: true,
    },
  });

  await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });

  return NextResponse.json({
    order: {
      id: order.id,
      status: order.status,
      subtotal: Number(order.subtotal),
      deliveryFee: Number(order.deliveryFee),
      total: Number(order.total),
      items: order.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        productType: item.productType,
        name: item.name,
        price: Number(item.price),
        quantity: item.quantity,
        imageUrl: item.imageUrl,
        createdAt: item.createdAt,
      })),
      createdAt: order.createdAt,
    },
  });
}
