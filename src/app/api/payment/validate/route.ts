import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import prisma from "@/lib/prisma";
import { validatePayment } from "@/lib/sslcommerz";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

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

  let validationResult: Awaited<ReturnType<typeof validatePayment>>;
  try {
    validationResult = await validatePayment(valId);
  } catch {
    return NextResponse.json(
      { error: "Validation request failed" },
      { status: 500 }
    );
  }

  const tranId = validationResult.tran_id ?? "";
  const amount = validationResult.amount ?? "";
  const status = validationResult.status ?? "";

  const order = await prisma.order.findFirst({
    where: { sslTxnId: tranId },
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
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
    return NextResponse.json({ error: "Amount mismatch" }, { status: 400 });
  }

  if (status !== "VALID") {
    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: "payment_failed",
        paymentStatus: "failed",
      },
    });
    return NextResponse.json({ error: "Payment not valid" }, { status: 400 });
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

  return NextResponse.json({ status: "VALID", tran_id: tranId, amount: numericAmount });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const valId = searchParams.get("val_id") ?? "";

  if (!valId) {
    return NextResponse.json({ error: "val_id is required" }, { status: 400 });
  }

  let validationResult: Awaited<ReturnType<typeof validatePayment>>;
  try {
    validationResult = await validatePayment(valId);
  } catch {
    return NextResponse.json(
      { error: "Validation request failed" },
      { status: 500 }
    );
  }

  const tranId = validationResult.tran_id ?? "";
  const amount = validationResult.amount ?? "";
  const status = validationResult.status ?? "";

  const order = await prisma.order.findFirst({
    where: { sslTxnId: tranId },
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
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
    return NextResponse.json({ error: "Amount mismatch" }, { status: 400 });
  }

  if (status !== "VALID") {
    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: "payment_failed",
        paymentStatus: "failed",
      },
    });
    return NextResponse.json({ error: "Payment not valid" }, { status: 400 });
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

  return NextResponse.json({ status: "VALID", tran_id: tranId, amount: numericAmount });
}