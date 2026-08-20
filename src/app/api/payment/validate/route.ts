import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import prisma from "@/lib/prisma";
import { validatePayment } from "@/lib/sslcommerz";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

async function validateOrderPayment(valId: string) {
  let validationResult: Awaited<ReturnType<typeof validatePayment>>;
  try {
    validationResult = await validatePayment(valId);
  } catch {
    return { error: "Validation request failed", status: 500 };
  }

  const tranId = validationResult.tran_id ?? "";
  const amount = validationResult.amount ?? "";
  const status = validationResult.status ?? "";

  if (!tranId || !amount || !status) {
    return { error: "Invalid validation response", status: 400 };
  }

  const order = await prisma.order.findFirst({
    where: { sslTxnId: tranId },
  });

  if (!order) {
    return { error: "Order not found", status: 404 };
  }

  const numericAmount = Number(amount);
  const numericOrderTotal = Number(order.total);

  if (Math.abs(numericAmount - numericOrderTotal) > 0.01) {
    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: "payment_failed",
        paymentStatus: "failed",
      },
    });
    return { error: "Amount mismatch", status: 400 };
  }

  if (status !== "VALID") {
    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: "payment_failed",
        paymentStatus: "failed",
      },
    });
    return { error: "Payment not valid", status: 400 };
  }

  if (order.paymentStatus === "paid") {
    return { status: "VALID", tran_id: tranId, amount: numericAmount };
  }

  await prisma.order.update({
    where: { id: order.id },
    data: {
      status: "paid",
      paymentStatus: "paid",
      sslAmount: numericAmount,
    },
  });

  revalidateTag("orders", "default");
  revalidateTag("user-orders", "default");

  return { status: "VALID", tran_id: tranId, amount: numericAmount };
}

export async function POST(request: Request) {
  const rateLimitId = `ip:${getClientIp(request)}`;
  const { success } = await checkRateLimit(rateLimitId, "strict");
  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const body = await request.text();
  const params = new URLSearchParams(body);

  const valId = params.get("val_id") ?? "";
  if (!valId) {
    return NextResponse.json({ error: "val_id is required" }, { status: 400 });
  }

  const result = await validateOrderPayment(valId);

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status as number });
  }

  return NextResponse.json(result);
}

export async function GET(request: Request) {
  const rateLimitId = `ip:${getClientIp(request)}`;
  const { success } = await checkRateLimit(rateLimitId, "strict");
  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const valId = new URL(request.url).searchParams.get("val_id") ?? "";
  if (!valId) {
    return NextResponse.json({ error: "val_id is required" }, { status: 400 });
  }

  const result = await validateOrderPayment(valId);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status as number });
  }

  return NextResponse.json(result);
}
