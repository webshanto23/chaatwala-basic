import { NextResponse } from "next/server";
import { requireRole, authorize, unauthorizedResponse } from "@/lib/authorize";
import prisma from "@/lib/prisma";

export async function GET(_request: Request, { params }: { params: Promise<{ orderId: string }> }) {
  const { authorized: roleAuthorized } = await requireRole("admin");
  if (!roleAuthorized) {
    return unauthorizedResponse("You do not have permission to view orders");
  }

  const { authorized } = await authorize({ permissions: ["order:view"] });
  if (!authorized) {
    return unauthorizedResponse("You do not have permission to view orders");
  }

  const { orderId } = await params;

  const order = await prisma.order.findFirst({
    where: { id: orderId },
    include: {
      user: { select: { name: true, email: true } },
      items: true,
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  return NextResponse.json({
    order: {
      id: order.id,
      status: order.status,
      total: Number(order.total).toFixed(2),
      sslTxnId: order.sslTxnId,
      paymentMethod: order.paymentMethod,
      createdAt: order.createdAt,
      user: order.user,
      items: order.items,
    },
  });
}
