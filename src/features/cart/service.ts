import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { cookies } from "next/headers";

const GUEST_COOKIE = "chaatwala_guest_id";

async function getGuestId() {
  const cookieStore = await cookies();
  let guestId = cookieStore.get(GUEST_COOKIE)?.value;
  if (!guestId) {
    guestId = crypto.randomUUID();
    cookieStore.set(GUEST_COOKIE, guestId, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
  }
  return guestId;
}

export async function getCart() {
  const session = await auth();
  const userId = session?.user?.id ?? null;

  if (userId) {
    let cart = await prisma.cart.findFirst({
      where: { userId },
      include: { items: { orderBy: { createdAt: "desc" } } },
    });
    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId },
        include: { items: true },
      });
    }
    return cart;
  }

  const guestId = await getGuestId();
  let cart = await prisma.cart.findUnique({
    where: { guestId },
    include: { items: { orderBy: { createdAt: "desc" } } },
  });
  if (!cart) {
    cart = await prisma.cart.create({
      data: { guestId },
      include: { items: true },
    });
  }
  return cart;
}

export async function addToCart(input: { productId: string; productType: string; quantity?: number }) {
  const cart = await getCart();
  const existing = cart.items.find(item => item.productId === input.productId);

  if (existing) {
    await prisma.cartItem.update({
      where: { id: existing.id },
      data: { quantity: existing.quantity + (input.quantity ?? 1) },
    });
  } else {
    await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId: input.productId,
        productType: input.productType,
        name: "Product",
        price: 0,
        quantity: input.quantity ?? 1,
        imageUrl: null,
      },
    });
  }

  return getCart();
}

export async function updateCartItem(itemId: string, quantity: number) {
  if (quantity <= 0) {
    await prisma.cartItem.delete({ where: { id: itemId } });
  } else {
    await prisma.cartItem.update({ where: { id: itemId }, data: { quantity } });
  }
  return getCart();
}

export async function removeCartItem(itemId: string) {
  await prisma.cartItem.delete({ where: { id: itemId } });
  return getCart();
}
