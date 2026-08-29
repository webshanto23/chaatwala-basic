import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { initiatePayment } from "@/lib/sslcommerz";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { getUnavailableCartItems } from "@/lib/store-availability";
import { getCalculatedFood } from "@/features/food/service";

const DELIVERY_FEE = 50;

function getPaymentPublicUrl() {
  const value = process.env.PAYMENT_PUBLIC_URL;
  if (!value) throw new Error("PAYMENT_PUBLIC_URL is not configured");
  const url = new URL(value);
  if (url.protocol !== "https:" || ["localhost", "127.0.0.1", "::1"].includes(url.hostname)) throw new Error("PAYMENT_PUBLIC_URL must be a publicly reachable HTTPS URL");
  return url.origin;
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user || session.user.workspace !== "customer") return NextResponse.json({ error: "Please sign in to checkout" }, { status: 401 });
  const rate = await checkRateLimit(`payment:${session.user.id}:${getClientIp(request)}`, "strict");
  if (!rate.success) return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });

  let body: { storeId?: string; addressId?: string; orderId?: string };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid checkout request" }, { status: 400 }); }
  if (!body.storeId || !body.addressId) return NextResponse.json({ error: "storeId and addressId are required" }, { status: 400 });

  let publicUrl: string;
  try { publicUrl = getPaymentPublicUrl(); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Payment callback configuration is invalid" }, { status: 503 }); }

  const [store, address] = await Promise.all([
    prisma.store.findFirst({ where: { id: body.storeId, isOpen: true }, select: { id: true } }),
    prisma.address.findFirst({ where: { id: body.addressId, userId: session.user.id }, select: { id: true, fullName: true, phone: true, line1: true, city: true, postalCode: true, country: true } }),
  ]);
  if (!store) return NextResponse.json({ error: "Store is unavailable" }, { status: 409 });
  if (!address) return NextResponse.json({ error: "Address not found" }, { status: 404 });

  let order: { id: string; total: { toString(): string }; items: { productId: string; productType: string; name: string; price: { toString(): string }; quantity: number }[] };
  if (body.orderId) {
    const existing = await prisma.order.findFirst({ where: { id: body.orderId, userId: session.user.id, paymentStatus: { not: "paid" } }, include: { items: true } });
    if (!existing) return NextResponse.json({ error: "Pending order not found" }, { status: 404 });
    if (existing.storeId !== store.id || existing.addressId !== address.id) return NextResponse.json({ error: "Checkout details no longer match the pending order" }, { status: 409 });
    order = existing;
  } else {
    const cart = await prisma.cart.findFirst({ where: { userId: session.user.id }, include: { items: true } });
    if (!cart?.items.length) return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    const unavailable = await getUnavailableCartItems(store.id, cart.items);
    if (unavailable.length) return NextResponse.json({ error: `${unavailable.map((item) => item.name).join(", ")} is unavailable at this store` }, { status: 409 });
    const foods = await Promise.all(cart.items.map((item) => getCalculatedFood(item.productId, store.id)));
    for (const [index, item] of cart.items.entries()) {
      const food = foods[index];
      if (!food || !food.isAvailable || Math.abs(food.finalPrice - Number(item.price)) > 0.01) return NextResponse.json({ error: `Price or availability changed for ${item.name}. Please refresh your cart.` }, { status: 409 });
    }
    const subtotal = cart.items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
    order = await prisma.order.create({
      data: {
        userId: session.user.id, addressId: address.id, storeId: store.id, subtotal, deliveryFee: DELIVERY_FEE, total: subtotal + DELIVERY_FEE,
        paymentStatus: "pending", status: "pending",
        items: { create: cart.items.map((item) => ({ productId: item.productId, productType: item.productType, name: item.name, price: item.price, quantity: item.quantity, imageUrl: item.imageUrl })) },
      },
      include: { items: true },
    });
  }

  const transactionId = `txn_${crypto.randomUUID()}`;
  const amount = Number(order.total);
  const attempt = await prisma.$transaction(async (tx) => {
    const created = await tx.paymentAttempt.create({ data: { orderId: order.id, transactionId, amount, status: "PENDING" } });
    await tx.order.update({ where: { id: order.id }, data: { sslTxnId: transactionId, sslAmount: amount, paymentStatus: "pending" } });
    return created;
  });

  try {
    const gateway = await initiatePayment({
      tran_id: transactionId, total_amount: amount, currency: "BDT",
      success_url: `${publicUrl}/checkout/success`, fail_url: `${publicUrl}/checkout/fail`, cancel_url: `${publicUrl}/checkout/cancel`, ipn_url: `${publicUrl}/api/payment/validate`,
      shipping_method: "Courier", product_name: order.items.map((item) => item.name).join(", "), product_category: "food", product_profile: "general",
      cus_name: session.user.name ?? address.fullName, cus_email: session.user.email ?? "customer@example.com", cus_phone: address.phone,
      cus_add1: address.line1, cus_city: address.city, cus_state: "", cus_postcode: address.postalCode, cus_country: address.country ?? "BD",
      ship_name: address.fullName, ship_add1: address.line1, ship_city: address.city, ship_state: "", ship_postcode: address.postalCode, ship_country: address.country ?? "BD", value_a: order.id,
    });
    return NextResponse.json({ gatewayUrl: gateway.GatewayPageURL, orderId: order.id, tranId: attempt.transactionId });
  } catch (error) {
    await prisma.paymentAttempt.update({ where: { id: attempt.id }, data: { status: "FAILED", failureReason: error instanceof Error ? error.message : "Payment initiation failed" } });
    return NextResponse.json({ error: "Payment initiation failed. Your cart is still available to retry.", orderId: order.id }, { status: 502 });
  }
}
