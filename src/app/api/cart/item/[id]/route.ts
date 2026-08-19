import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { revalidateTag } from "next/cache";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { auth } from "@/lib/auth";
import { cookies } from "next/headers";

const GUEST_COOKIE = "chaatwala_guest_id";

async function getGuestIdFromCookie() {
  const cookieStore = await cookies();
  return cookieStore.get(GUEST_COOKIE)?.value ?? null;
}

async function resolveCartOwner() {
  const session = await auth();
  const userId = session?.user?.id ?? null;
  const guestId = userId ? null : await getGuestIdFromCookie();
  return { session, userId, guestId };
}

async function getCartIdForOwner(userId: string | null, guestId: string | null, itemId: string) {
  const item = await prisma.cartItem.findUnique({
    where: { id: itemId },
    select: { cartId: true },
  });

  if (!item) {
    return null;
  }

  const cart = await prisma.cart.findUnique({
    where: { id: item.cartId },
    select: { id: true, userId: true, guestId: true },
  });

  if (!cart) {
    return null;
  }

  if (userId && cart.userId === userId) {
    return cart.id;
  }

  if (!userId && guestId && cart.guestId === guestId) {
    return cart.id;
  }

  return null;
}

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
  const { userId, guestId } = await resolveCartOwner();

  if (!userId && !guestId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rateLimitId = userId ?? `ip:${getClientIp(request)}`;
  const { success } = await checkRateLimit(rateLimitId, "medium");
  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const { quantity } = body as { quantity?: number };

  if (typeof quantity !== "number" || quantity < 1) {
    return NextResponse.json({ error: "Quantity must be at least 1" }, { status: 400 });
  }

  const cartId = await getCartIdForOwner(userId, guestId, id);
  if (!cartId) {
    return NextResponse.json({ error: "Cart item not found or access denied" }, { status: 404 });
  }

  const updated = await prisma.cartItem.update({
    where: { id },
    data: { quantity },
  });

  revalidateTag("cart", "default");
  return NextResponse.json({ item: serializeCartItem(updated) });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId, guestId } = await resolveCartOwner();

  if (!userId && !guestId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rateLimitId = userId ?? `ip:${getClientIp(request)}`;
  const { success } = await checkRateLimit(rateLimitId, "medium");
  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { id } = await params;
  const cartId = await getCartIdForOwner(userId, guestId, id);
  if (!cartId) {
    return NextResponse.json({ error: "Cart item not found or access denied" }, { status: 404 });
  }

  await prisma.cartItem.delete({ where: { id } });

  const cart = await prisma.cart.findUnique({
    where: { id: cartId },
    include: { items: { orderBy: { createdAt: "desc" } } },
  });

  revalidateTag("cart", "default");

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
