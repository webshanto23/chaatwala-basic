import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user || session.user.workspace !== "customer") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const transactionId = new URL(request.url).searchParams.get("tran_id") ?? "";
  if (!transactionId) return NextResponse.json({ error: "tran_id is required" }, { status: 400 });
  const attempt = await prisma.paymentAttempt.findFirst({ where: { transactionId, order: { userId: session.user.id } }, select: { transactionId: true, status: true, orderId: true, order: { select: { paymentStatus: true, total: true } } } });
  if (!attempt) return NextResponse.json({ error: "Payment attempt not found" }, { status: 404 });
  return NextResponse.json({ tranId: attempt.transactionId, status: attempt.status, orderId: attempt.orderId, paymentStatus: attempt.order.paymentStatus, total: Number(attempt.order.total) });
}
