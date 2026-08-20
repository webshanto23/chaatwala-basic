import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { getUnavailableCartItems } from "@/lib/store-availability";

export async function POST(request: Request) {
  const session = await auth();
  const userId = session?.user?.id;

  const rateLimitId = userId ?? `ip:${getClientIp(request)}`;
  const { success } = await checkRateLimit(rateLimitId, "strict");
  if (!success) {
    return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  }

  const body = await request.json().catch(() => ({}));
  const { addressId, storeId } = body as { addressId?: string; storeId?: string };
  const idempotencyKey = request.headers.get("idempotency-key");

  if (!addressId) {
    return NextResponse.json({ error: "addressId is required" }, { status: 400 });
  }

  if (!storeId) {
    return NextResponse.json({ error: "storeId is required" }, { status: 400 });
  }

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

  const store = await prisma.store.findUnique({
    where: { id: storeId },
    select: { id: true },
  });

  if (!store) {
    return NextResponse.json({ error: "Store not found" }, { status: 404 });
  }

  const address = await prisma.address.findFirst({
    where: { id: addressId, userId: userId ?? undefined },
  });

  if (!address) {
    return NextResponse.json({ error: "Address not found" }, { status: 404 });
  }

  const unavailableItems = await getUnavailableCartItems(storeId, cart.items);

  if (unavailableItems.length > 0) {
    return NextResponse.json(
      { error: `${unavailableItems.map((item) => item.name).join(", ")} is Out of stock, Please wait or Select Another Store.`, unavailableItems: unavailableItems.map((item) => item.name) },
      { status: 409 }
    );
  }

  if (idempotencyKey) {
    const existing = await prisma.order.findFirst({
      where: { idempotencyKey },
      include: { items: true, address: true },
    });
    if (existing) {
      return NextResponse.json({
        order: {
          id: existing.id,
          status: existing.status,
          subtotal: Number(existing.subtotal),
          deliveryFee: Number(existing.deliveryFee),
          total: Number(existing.total),
          items: existing.items.map((item) => ({
            id: item.id,
            productId: item.productId,
            productType: item.productType,
            name: item.name,
            price: Number(item.price),
            quantity: item.quantity,
            imageUrl: item.imageUrl,
            createdAt: item.createdAt,
          })),
          createdAt: existing.createdAt,
        },
      });
    }
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
      idempotencyKey: idempotencyKey ?? undefined,
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
