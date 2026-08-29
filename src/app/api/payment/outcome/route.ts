import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user || session.user.workspace !== "customer") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null) as { tranId?: string; outcome?: "FAILED" | "CANCELLED" } | null;
  if (!body?.tranId || !body.outcome) return NextResponse.json({ error: "Invalid payment outcome" }, { status: 400 });
  const result = await prisma.paymentAttempt.updateMany({ where: { transactionId: body.tranId, status: "PENDING", order: { userId: session.user.id } }, data: { status: body.outcome, failureReason: body.outcome === "CANCELLED" ? "Cancelled by customer" : "Gateway reported failure" } });
  if (!result.count) return NextResponse.json({ error: "Payment attempt not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}
