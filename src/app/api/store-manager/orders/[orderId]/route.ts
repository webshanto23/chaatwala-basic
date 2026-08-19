import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { requireRole, authorize, unauthorizedResponse } from "@/lib/authorize";
import { getUserRole } from "@/lib/authorize";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest, { params }: { params: Promise<{ orderId: string }> }) {
  const { authorized, session } = await requireRole("store_manager");
  if (!authorized || !session?.user) {
    return unauthorizedResponse("You do not have permission to view orders");
  }

  const role = getUserRole(session);
  if (role !== "store_manager") {
    return unauthorizedResponse("You do not have permission to view orders");
  }

  const { authorized: permAuthorized } = await authorize({ permissions: ["order:view"] });
  if (!permAuthorized) {
    return unauthorizedResponse("You do not have permission to view orders");
  }

  const { orderId } = await params;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { managedStore: { select: { id: true } } },
  });

  if (!user?.managedStore) {
    return NextResponse.json({ error: "No store assigned" }, { status: 403 });
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      user: { select: { name: true, email: true } },
      items: true,
    },
  });

  if (!order || order.storeId !== user.managedStore.id) {
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
      items: order.items.map((item) => ({
        id: item.id,
        name: item.name,
        price: Number(item.price),
        quantity: item.quantity,
        imageUrl: item.imageUrl,
      })),
    },
  });
}
