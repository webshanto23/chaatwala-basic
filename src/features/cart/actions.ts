"use server";

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

async function getOrCreateCart(userId?: string | null) {
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

export async function getCartAction() {
  const session = await auth();
  const cart = await getOrCreateCart(session?.user?.id ?? null);
  return {
    cart: {
      id: cart.id,
      userId: cart.userId,
      guestId: cart.guestId,
      items: cart.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        productType: item.productType,
        name: item.name,
        price: Number(item.price),
        quantity: item.quantity,
        imageUrl: item.imageUrl,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      })),
      createdAt: cart.createdAt,
      updatedAt: cart.updatedAt,
    },
  };
}
