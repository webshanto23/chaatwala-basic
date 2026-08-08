import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { revalidateTag } from "next/cache";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { initiatePayment } from "@/lib/sslcommerz";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const BASE_URL = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

async function getCartWithProducts(userId: string | null, guestId: string | null) {
  if (userId) {
    const cart = await prisma.cart.findFirst({
      where: { userId },
      include: { items: true },
    });
    return cart;
  }
  if (guestId) {
    const cart = await prisma.cart.findUnique({
      where: { guestId },
      include: { items: true },
    });
    return cart;
  }
  return null;
}

export async function POST(request: Request) {
  const session = await auth();
  const userId = session?.user?.id ?? null;

  const rateLimitId = userId ?? `ip:${getClientIp(request)}`;
  const { success } = await checkRateLimit(rateLimitId, "strict");
  if (!success) {
    return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  }

  let guestId: string | null = null;
  if (!userId) {
    const cookieStore = await cookies();
    guestId = cookieStore.get("chaatwala_guest_id")?.value ?? null;
  }

  const cart = await getCartWithProducts(userId, guestId);

  if (!cart || cart.items.length === 0) {
    return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
  }

  const dishIds = cart.items
    .filter((item) => item.productType === "dish")
    .map((item) => item.productId);
  const drinkIds = cart.items
    .filter((item) => item.productType === "drink")
    .map((item) => item.productId);
  const comboIds = cart.items
    .filter((item) => item.productType === "combo")
    .map((item) => item.productId);

  const [dishes, drinks, combos] = await Promise.all([
    dishIds.length
      ? prisma.dish.findMany({
          where: { id: { in: dishIds } },
          select: { id: true, price: true, imageUrl: true },
        })
      : Promise.resolve([]),
    drinkIds.length
      ? prisma.drink.findMany({
          where: { id: { in: drinkIds } },
          select: { id: true, price: true, imageUrl: true },
        })
      : Promise.resolve([]),
    comboIds.length
      ? prisma.combo.findMany({
          where: { id: { in: comboIds } },
          select: { id: true, price: true, imageUrl: true },
        })
      : Promise.resolve([]),
  ]);

  const dishMap = new Map(dishes.map((d) => [d.id, d]));
  const drinkMap = new Map(drinks.map((d) => [d.id, d]));
  const comboMap = new Map(combos.map((c) => [c.id, c]));

  const cachedPrices = new Map<string, { price: number; name: string; imageUrl: string | null }>();

  for (const item of cart.items) {
    let dbProduct: { price: unknown; imageUrl: string | null } | undefined;
    if (item.productType === "dish") {
      dbProduct = dishMap.get(item.productId);
    } else if (item.productType === "drink") {
      dbProduct = drinkMap.get(item.productId);
    } else if (item.productType === "combo") {
      dbProduct = comboMap.get(item.productId);
    }

    if (!dbProduct) {
      return NextResponse.json(
        { error: `Product not found: ${item.productId}` },
        { status: 404 }
      );
    }

    const numericDbPrice = Number(dbProduct.price);
    const numericCartPrice = Number(item.price);
    if (Math.abs(numericDbPrice - numericCartPrice) > 0.01) {
      return NextResponse.json(
        { error: `Price mismatch for ${item.name}. Please refresh your cart.` },
        { status: 400 }
      );
    }
    cachedPrices.set(item.id, {
      price: numericDbPrice,
      name: item.name,
      imageUrl: dbProduct.imageUrl,
    });
  }

  const subtotal = cart.items.reduce(
    (sum, item) => sum + Number(item.price) * item.quantity,
    0
  );
  const deliveryFee = 50;
  const total = subtotal + deliveryFee;

  const tranId = `txn_${crypto.randomUUID()}`;

  const idempotencyKey = request.headers.get("idempotency-key") ?? crypto.randomUUID();

  const existingOrder = await prisma.order.findFirst({
    where: { idempotencyKey },
  });
  if (existingOrder) {
    return NextResponse.json({
      orderId: existingOrder.id,
      tranId: existingOrder.sslTxnId,
      gatewayUrl: existingOrder.sslTxnId ? `${BASE_URL}/checkout/success?tran_id=${existingOrder.sslTxnId}` : null,
      message: "Order already exists",
    });
  }

  const order = await prisma.order.create({
    data: {
      userId: userId ?? undefined,
      subtotal,
      deliveryFee,
      total,
      idempotencyKey,
      paymentStatus: "pending",
      sslTxnId: tranId,
      sslAmount: total,
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
    include: { items: true },
  });

  await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });

  revalidateTag("orders", "default");
  revalidateTag("user-orders", "default");

  const cusName = session?.user?.name ?? "Guest";
  const cusEmail = session?.user?.email ?? "guest@example.com";
  const cusPhone = "01700000000";

  let shipFullName = cusName;
  let shipLine1 = "";
  let shipCity = "";
  let shipPostcode = "";
  let shipCountry = "BD";

  try {
    const body = await request.json();
    const addr = body.shippingAddress;
    if (addr) {
      shipFullName = addr.fullName ?? cusName;
      shipLine1 = addr.line1 ?? "";
      shipCity = addr.city ?? "";
      shipPostcode = addr.postalCode ?? "";
      shipCountry = addr.country ?? "BD";
    }
  } catch {
    // body not available, use defaults
  }

  const productNames = cart.items.map((item) => item.name).join(", ");
  const productCategory = cart.items.map((item) => item.productType).join(", ");

  try {
    const gatewayResponse = await initiatePayment({
      tran_id: tranId,
      total_amount: total,
      currency: "BDT",
      success_url: `${BASE_URL}/checkout/success`,
      fail_url: `${BASE_URL}/checkout/fail`,
      cancel_url: `${BASE_URL}/checkout/cancel`,
      ipn_url: `${BASE_URL}/api/payment/validate`,
      shipping_method: "Courier",
      product_name: productNames,
      product_category: productCategory,
      product_profile: "general",
      cus_name: cusName,
      cus_email: cusEmail,
      cus_phone: cusPhone,
      cus_add1: shipLine1,
      cus_city: shipCity,
      cus_state: "",
      cus_postcode: shipPostcode,
      cus_country: shipCountry,
      ship_name: shipFullName,
      ship_add1: shipLine1,
      ship_city: shipCity,
      ship_state: "",
      ship_postcode: shipPostcode,
      ship_country: shipCountry,
      value_a: order.id,
      value_b: userId ?? "",
    });

    return NextResponse.json({
      gatewayUrl: gatewayResponse.GatewayPageURL,
      tranId: tranId,
      orderId: order.id,
    });
  } catch (err) {
    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: "payment_failed",
        paymentStatus: "failed",
      },
    });

    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: `Payment initiation failed: ${message}` }, { status: 500 });
  }
}
