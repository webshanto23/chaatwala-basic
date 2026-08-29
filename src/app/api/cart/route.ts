import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import { unstable_cache, revalidateTag } from "next/cache";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { auth } from "@/lib/auth";
import { findProduct, getEffectivePrice } from "@/lib/products";

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

async function getOrCreateCart(userId?: string | null, guestId?: string | null) {
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

  const resolvedGuestId = guestId ?? await getGuestId();
  let cart = await prisma.cart.findUnique({
    where: { guestId: resolvedGuestId },
    include: { items: { orderBy: { createdAt: "desc" } } },
  });
  if (!cart) {
    cart = await prisma.cart.create({
      data: { guestId: resolvedGuestId },
      include: { items: true },
    });
  }
  return cart;
}

function serializeCart(cart: Awaited<ReturnType<typeof getOrCreateCart>>) {
  return {
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
  };
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (session?.user.workspace === "staff") return NextResponse.json({ error: "Customer cart access only" }, { status: 403 });
  const rateLimitId = session?.user?.id ?? `ip:${getClientIp(new Request("http://localhost"))}`;
  const { success } = await checkRateLimit(rateLimitId, "medium");
  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const cart = await getOrCreateCart(session?.user?.id ?? null);
  await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
  const updated = await prisma.cart.findUnique({
    where: { id: cart.id },
    include: { items: { orderBy: { createdAt: "desc" } } },
  });
  revalidateTag("cart", "default");
  return NextResponse.json({ cart: serializeCart(updated!) });
}

export async function GET(request: Request) {
  const session = await auth();
  if (session?.user.workspace === "staff") return NextResponse.json({ error: "Customer cart access only" }, { status: 403 });
  const userId = session?.user?.id ?? null;
  const guestId = userId ? null : await getGuestId();

  const cacheKey = ["cart", userId ?? guestId ?? "guest"];

  const cartData = await unstable_cache(
    async () => {
      const cart = await getOrCreateCart(userId, guestId ?? undefined);
      return serializeCart(cart);
    },
    cacheKey,
    { revalidate: 60, tags: ["cart"] }
  )();

  return NextResponse.json({ cart: cartData });
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (session?.user.workspace === "staff") return NextResponse.json({ error: "Customer cart access only" }, { status: 403 });
    const rateLimitId = session?.user?.id ?? `ip:${getClientIp(request)}`;
    const { success } = await checkRateLimit(rateLimitId, "medium");
    if (!success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const body = await request.json().catch(() => ({}));
    const { productId, productType, quantity = 1 } = body as {
      productId?: string;
      productType?: string;
      quantity?: number;
    };

    if (!productId || !productType) {
      return NextResponse.json({ error: "productId and productType are required" }, { status: 400 });
    }

    const validTypes = new Set(["food"]);
    if (!validTypes.has(productType)) {
      return NextResponse.json({ error: "Invalid productType" }, { status: 400 });
    }

    const product = await findProduct(productId);
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const numericPrice = getEffectivePrice(product);

    const cart = await getOrCreateCart(session?.user?.id ?? null);

    const existing = await prisma.cartItem.findFirst({
      where: { cartId: cart.id, productId, productType },
    });

    if (existing) {
      await prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: { increment: quantity } },
      });
    } else {
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          productType,
          name: product.name,
          price: numericPrice,
          quantity,
          imageUrl: product.imageUrl,
        },
      });
    }

    const updatedCart = await prisma.cart.findUnique({
      where: { id: cart.id },
      include: { items: { orderBy: { createdAt: "desc" } } },
    });

    revalidateTag("cart", "default");
    return NextResponse.json({ cart: serializeCart(updatedCart!) });
  } catch (error) {
    console.error("Cart API error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
