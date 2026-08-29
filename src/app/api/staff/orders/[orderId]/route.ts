import { NextResponse } from "next/server";
import { authorize, requireWorkspace, unauthorizedResponse } from "@/lib/authorize";
import prisma from "@/lib/prisma";

export async function GET(_request: Request, { params }: { params: Promise<{ orderId: string }> }) {
  const { authorized: workspaceAuthorized, session } = await requireWorkspace("staff");
  if (!workspaceAuthorized || !session?.user) return unauthorizedResponse("You do not have permission to view orders");
  const { authorized } = await authorize({ permissions: ["order:view"] });
  if (!authorized) return unauthorizedResponse("You do not have permission to view orders");

  const { orderId } = await params;
  const [order, stores] = await Promise.all([
    prisma.order.findUnique({ where: { id: orderId }, include: { user: { select: { name: true, email: true } }, items: true } }),
    prisma.staffStoreAccess.findMany({ where: { userId: session.user.id }, select: { storeId: true } }),
  ]);
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const canAccessAllStores = session.user.permissions.includes("*");
  if (!canAccessAllStores && !stores.some((access) => access.storeId === order.storeId)) {
    return NextResponse.json({ error: "Order not found or access denied" }, { status: 404 });
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
      items: order.items.map((item) => ({ id: item.id, name: item.name, price: Number(item.price), quantity: item.quantity, imageUrl: item.imageUrl })),
    },
  });
}
