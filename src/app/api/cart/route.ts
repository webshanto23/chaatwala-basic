import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import { unstable_cache, revalidateTag } from "next/cache";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

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

async function findProduct(productType: string, productId: string) {
  if (productType === "dish") {
    return prisma.dish.findUnique({ where: { id: productId } });
  }
  if (productType === "drink") {
    return prisma.drink.findUnique({ where: { id: productId } });
  }
  if (productType === "combo") {
    return prisma.combo.findUnique({ where: { id: productId } });
  }
  return null;
}

function productName(product: unknown, productType: string) {
  if (productType === "dish") return (product as { name: string }).name;
  if (productType === "drink") return (product as { name: string }).name;
  return (product as { name: string }).name;
}

function productPrice(product: unknown) {
  const price = (product as { price: unknown }).price;
  return typeof price === "object" && price !== null && "toNumber" in price
    ? (price as { toNumber: () => number }).toNumber()
    : Number(price);
}

function productImage(product: unknown, productType: string) {
  if (productType === "dish") return (product as { imageUrl: string | null }).imageUrl ?? null;
  if (productType === "drink") return (product as { imageUrl: string | null }).imageUrl ?? null;
  return (product as { imageUrl: string | null }).imageUrl ?? null;
}

export async function DELETE() {
  const session = await (await import("@/lib/auth")).auth();
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

export async function GET() {
  const session = await (await import("@/lib/auth")).auth();
  const guestId = session?.user?.id ? null : await getGuestId();

  return unstable_cache(
    async () => {
      const cart = await getOrCreateCart(session?.user?.id ?? null);
      return NextResponse.json({ cart: serializeCart(cart) });
    },
    ["cart", session?.user?.id ?? (guestId ?? "guest")],
    { revalidate: 60, tags: ["cart"] }
  )();
}

export async function POST(request: Request) {
  try {
    const session = await (await import("@/lib/auth")).auth();
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

    const validTypes = new Set(["dish", "drink", "combo"]);
    if (!validTypes.has(productType)) {
      return NextResponse.json({ error: "Invalid productType" }, { status: 400 });
    }

    const product = await findProduct(productType, productId);
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const numericPrice = productPrice(product);

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
          name: productName(product, productType),
          price: numericPrice,
          quantity,
          imageUrl: productImage(product, productType),
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
