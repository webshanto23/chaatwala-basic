import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import prisma from "@/lib/prisma";
import { validatePayment } from "@/lib/sslcommerz";
import { checkRateLimit } from "@/lib/rate-limit";

async function removeOrderedCartQuantities(orderId: string, userId: string | null) {
  if (!userId) return;
  const [cart, orderItems] = await Promise.all([
    prisma.cart.findFirst({ where: { userId }, include: { items: true } }),
    prisma.orderItem.findMany({ where: { orderId }, select: { productId: true, productType: true, quantity: true } }),
  ]);
  if (!cart) return;
  for (const ordered of orderItems) {
    const cartItem = cart.items.find((item) => item.productId === ordered.productId && item.productType === ordered.productType);
    if (!cartItem) continue;
    if (cartItem.quantity <= ordered.quantity) await prisma.cartItem.delete({ where: { id: cartItem.id } });
    else await prisma.cartItem.update({ where: { id: cartItem.id }, data: { quantity: cartItem.quantity - ordered.quantity } });
  }
}

async function validateOrderPayment(valId: string) {
  const validation = await validatePayment(valId);
  const transactionId = validation.tran_id ?? "";
  const amount = Number(validation.amount ?? "");
  if (!transactionId || !Number.isFinite(amount)) return { error: "Invalid validation response", status: 400 } as const;

  const attempt = await prisma.paymentAttempt.findUnique({ where: { transactionId }, include: { order: true } });
  if (!attempt) return { error: "Payment attempt not found", status: 404 } as const;
  if (Math.abs(amount - Number(attempt.amount)) > 0.01) {
    await prisma.paymentAttempt.update({ where: { id: attempt.id }, data: { status: "FAILED", validationId: valId, failureReason: "Amount mismatch" } });
    return { error: "Amount mismatch", status: 400 } as const;
  }
  if (validation.status !== "VALID") {
    await prisma.paymentAttempt.update({ where: { id: attempt.id }, data: { status: "FAILED", validationId: valId, failureReason: "Payment not valid" } });
    return { error: "Payment not valid", status: 400 } as const;
  }

  if (attempt.order.paymentStatus !== "paid") {
    await prisma.$transaction([
      prisma.paymentAttempt.update({ where: { id: attempt.id }, data: { status: "VALID", validationId: valId, validatedAt: new Date(), failureReason: null } }),
      prisma.order.update({ where: { id: attempt.orderId }, data: { status: "paid", paymentStatus: "paid", sslTxnId: transactionId, sslAmount: amount } }),
    ]);
    await removeOrderedCartQuantities(attempt.orderId, attempt.order.userId);
    revalidateTag("orders", "default");
    revalidateTag("user-orders", "default");
  } else if (attempt.status !== "VALID") {
    await prisma.paymentAttempt.update({ where: { id: attempt.id }, data: { status: "VALID", validationId: valId, validatedAt: new Date(), failureReason: null } });
  }
  return { status: "VALID", tran_id: transactionId, amount, orderId: attempt.orderId } as const;
}

async function handleValidation(valId: string) {
  const rate = await checkRateLimit(`payment-validation:${valId}`, "medium");
  if (!rate.success) return NextResponse.json({ error: "Too many validation attempts" }, { status: 429 });
  try {
    const result = await validateOrderPayment(valId);
    return "error" in result ? NextResponse.json({ error: result.error }, { status: result.status as number }) : NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Validation request failed" }, { status: 502 });
  }
}

export async function POST(request: Request) {
  const valId = new URLSearchParams(await request.text()).get("val_id") ?? "";
  return valId ? handleValidation(valId) : NextResponse.json({ error: "val_id is required" }, { status: 400 });
}

export async function GET(request: Request) {
  const valId = new URL(request.url).searchParams.get("val_id") ?? "";
  return valId ? handleValidation(valId) : NextResponse.json({ error: "val_id is required" }, { status: 400 });
}
