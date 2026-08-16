import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { cookies } from "next/headers";
import { findProduct, getEffectivePrice } from "@/lib/products";
import type { ProductType } from "@/features/cart/types";

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
    if (!cart || cart.userId !== userId) {
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

async function verifyItemOwnership(itemId: string) {
  const session = await auth();
  const userId = session?.user?.id ?? null;

  const item = await prisma.cartItem.findUnique({
    where: { id: itemId },
    include: {
      cart: { select: { id: true, userId: true, guestId: true } },
    },
  });

  if (!item) {
    throw new Error("Cart item not found");
  }

  if (userId) {
    if (item.cart.userId !== userId) {
      throw new Error("Unauthorized: item does not belong to this user");
    }
  } else {
    const guestId = await getGuestId();
    if (item.cart.guestId !== guestId) {
      throw new Error("Unauthorized: item does not belong to this user");
    }
  }

  return item;
}

export async function addToCart(input: { productId: string; productType: string; quantity?: number }) {
  const cart = await getCart();
  const session = await auth();
  const userId = session?.user?.id ?? null;

  if (userId && cart.userId !== userId) {
    throw new Error("Unauthorized: cart does not belong to this user");
  }

  const existing = cart.items.find(item => item.productId === input.productId);

  if (existing) {
    await prisma.cartItem.update({
      where: { id: existing.id },
      data: { quantity: existing.quantity + (input.quantity ?? 1) },
    });
  } else {
    const validTypes: ProductType[] = ["dish", "drink", "combo"];
    if (!validTypes.includes(input.productType as ProductType)) {
      throw new Error("Invalid productType");
    }

    const product = await findProduct(input.productType as ProductType, input.productId);
    if (!product) {
      throw new Error("Product not found");
    }

    const price = getEffectivePrice(product);

    await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId: input.productId,
        productType: input.productType,
        name: product.name,
        price,
        quantity: input.quantity ?? 1,
        imageUrl: product.imageUrl,
      },
    });
  }

  return getCart();
}

export async function updateCartItem(itemId: string, quantity: number) {
  await verifyItemOwnership(itemId);

  if (quantity <= 0) {
    await prisma.cartItem.delete({ where: { id: itemId } });
  } else {
    await prisma.cartItem.update({ where: { id: itemId }, data: { quantity } });
  }
  return getCart();
}

export async function removeCartItem(itemId: string) {
  await verifyItemOwnership(itemId);
  await prisma.cartItem.delete({ where: { id: itemId } });
  return getCart();
}
