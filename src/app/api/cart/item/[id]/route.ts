import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { revalidateTag } from "next/cache";

function serializeCartItem(item: Awaited<ReturnType<typeof prisma.cartItem.findUnique>>) {
  if (!item) return null;
  return {
    id: item.id,
    cartId: item.cartId,
    productId: item.productId,
    productType: item.productType,
    name: item.name,
    price: Number(item.price),
    quantity: item.quantity,
    imageUrl: item.imageUrl,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const { quantity } = body as { quantity?: number };

  if (typeof quantity !== "number" || quantity < 1) {
    return NextResponse.json({ error: "Quantity must be at least 1" }, { status: 400 });
  }

  const item = await prisma.cartItem.findUnique({ where: { id } });
  if (!item) {
    return NextResponse.json({ error: "Cart item not found" }, { status: 404 });
  }

  const updated = await prisma.cartItem.update({
    where: { id },
    data: { quantity },
  });

  revalidateTag("cart");
  return NextResponse.json({ item: serializeCartItem(updated) });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const item = await prisma.cartItem.findUnique({ where: { id } });
  if (!item) {
    return NextResponse.json({ error: "Cart item not found" }, { status: 404 });
  }

  await prisma.cartItem.delete({ where: { id } });

  const cart = await prisma.cart.findUnique({
    where: { id: item.cartId },
    include: { items: { orderBy: { createdAt: "desc" } } },
  });

  revalidateTag("cart");

  return NextResponse.json({
    cart: cart
      ? {
          id: cart.id,
          userId: cart.userId,
          guestId: cart.guestId,
          items: cart.items.map((i) => ({
            id: i.id,
            productId: i.productId,
            productType: i.productType,
            name: i.name,
            price: Number(i.price),
            quantity: i.quantity,
            imageUrl: i.imageUrl,
            createdAt: i.createdAt,
            updatedAt: i.updatedAt,
          })),
          createdAt: cart.createdAt,
          updatedAt: cart.updatedAt,
        }
      : null,
  });
}
