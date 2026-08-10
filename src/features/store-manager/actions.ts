"use server";

import { authorize, requirePermission } from "@/lib/authorize";
import { unstable_cache, revalidateTag } from "next/cache";
import prisma from "@/lib/prisma";
import { logAction } from "@/app/actions/audit";

type Store = {
  id: string;
  name: string;
  phone: string;
  address: string;
  imageUrl: string | null;
  managerId: string | null;
};

export type OrderRow = {
  id: string;
  userId: string;
  userName: string;
  status: string;
  total: string;
  paymentStatus: string;
  createdAt: Date;
  items: { name: string; quantity: number; price: number }[];
};

export async function getMyStore() {
  const { authorized, session } = await authorize({ permissions: ["store:view"] });
  if (!authorized || !session?.user) return { error: "Forbidden" };

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { managedStore: true },
  });

  if (!user?.managedStore) {
    return { error: "No store assigned" };
  }

  return {
    store: {
      id: user.managedStore.id,
      name: user.managedStore.name,
      phone: user.managedStore.phone,
      address: user.managedStore.address,
      imageUrl: user.managedStore.imageUrl,
      managerId: user.managedStore.managerId,
    } as Store,
  };
}

export async function getStoreDashboardStats() {
  const { authorized, session } = await authorize({ permissions: ["store:view"] });
  if (!authorized || !session?.user) return { error: "Forbidden" };

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { managedStore: { select: { id: true } } },
  });

  if (!user?.managedStore) {
    return { error: "No store assigned" };
  }

  const storeId = user.managedStore.id;

  const [totalOrders, pendingOrders, cancelledOrders, deliveredOrders, dishCount, drinkCount, comboCount, revenueData] = await Promise.all([
    unstable_cache(
      async () => prisma.order.count({ where: { storeId } }),
      ["store-dashboard-total-orders", storeId],
      { revalidate: 120, tags: ["store-orders"] }
    )(),
    unstable_cache(
      async () => prisma.order.count({ where: { storeId, status: "pending" } }),
      ["store-dashboard-pending-orders", storeId],
      { revalidate: 120, tags: ["store-orders"] }
    )(),
    unstable_cache(
      async () => prisma.order.count({ where: { storeId, status: "cancelled" } }),
      ["store-dashboard-cancelled-orders", storeId],
      { revalidate: 120, tags: ["store-orders"] }
    )(),
    unstable_cache(
      async () => prisma.order.count({ where: { storeId, status: "delivered" } }),
      ["store-dashboard-delivered-orders", storeId],
      { revalidate: 120, tags: ["store-orders"] }
    )(),
    unstable_cache(
      async () => prisma.dish.count({ where: { storeId } }),
      ["store-dashboard-dishes", storeId],
      { revalidate: 300, tags: ["dishes"] }
    )(),
    unstable_cache(
      async () => prisma.drink.count({ where: { storeId } }),
      ["store-dashboard-drinks", storeId],
      { revalidate: 300, tags: ["drinks"] }
    )(),
    unstable_cache(
      async () => prisma.combo.count({ where: { storeId } }),
      ["store-dashboard-combos", storeId],
      { revalidate: 300, tags: ["combos"] }
    )(),
    unstable_cache(
      async () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const [totalResult, todayResult] = await Promise.all([
          prisma.order.aggregate({ where: { storeId }, _sum: { total: true } }),
          prisma.order.aggregate({ where: { storeId, createdAt: { gte: today } }, _sum: { total: true } }),
        ]);
        return {
          totalEarnings: Number(totalResult._sum.total ?? 0),
          todayRevenue: Number(todayResult._sum.total ?? 0),
        };
      },
      ["store-dashboard-revenue", storeId],
      { revalidate: 120, tags: ["store-orders"] }
    )(),
  ]);

  const totalEarnings = revenueData.totalEarnings;
  const avgOrderValue = totalOrders > 0 ? totalEarnings / totalOrders : 0;

  return {
    stats: {
      totalOrders,
      pendingOrders,
      cancelledOrders,
      deliveredOrders,
      dishCount,
      drinkCount,
      comboCount,
      totalEarnings,
      todayRevenue: revenueData.todayRevenue,
      avgOrderValue,
    },
  };
}

export async function getStoreOrders(filters?: { status?: string; limit?: number; cursor?: string }): Promise<{ orders: OrderRow[]; nextCursor: string | null } | { error: string }> {
  const { authorized, session } = await authorize({ permissions: ["order:view"] });
  if (!authorized || !session?.user) return { error: "Forbidden" };

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { managedStore: { select: { id: true } } },
  });

  if (!user?.managedStore) {
    return { error: "No store assigned" };
  }

  const storeId = user.managedStore.id;
  const where: Record<string, unknown> = { storeId };
  if (filters?.status) where.status = filters.status;

  const take = filters?.limit ?? 25;
  const cursor = filters?.cursor ? { id: filters.cursor } : undefined;

  const orders = await unstable_cache(
    async () => {
      const result = await prisma.order.findMany({
        where,
        select: {
          id: true,
          userId: true,
          user: { select: { name: true, email: true } },
          status: true,
          total: true,
          paymentStatus: true,
          sslTxnId: true,
          createdAt: true,
          items: { select: { name: true, quantity: true, price: true } },
        },
        orderBy: { createdAt: "desc" },
        take,
        ...(cursor ? { skip: 1, cursor } : {}),
      });
      return result;
    },
    ["store-orders", storeId, filters?.status ?? "all", String(take), filters?.cursor ?? "start"],
    { revalidate: 60, tags: ["store-orders"] }
  )();

  const nextCursor: string | null = orders.length === take ? orders[orders.length - 1].id : null;

  return {
    orders: orders.map((order) => ({
      id: order.id,
      userId: order.userId ?? "-",
      userName: order.user?.name ?? order.user?.email ?? "-",
      status: order.status,
      total: Number(order.total).toFixed(2),
      paymentStatus: order.paymentStatus,
      transactionId: order.sslTxnId ?? "-",
      createdAt: order.createdAt,
      items: order.items.map((item) => ({ name: item.name, quantity: item.quantity, price: Number(item.price) })),
    })),
    nextCursor,
  };
}

export async function updateStoreOrderStatus(orderId: string, status: string) {
  const { authorized, session } = await authorize({ permissions: ["order:update"] });
  if (!authorized || !session?.user) return { error: "Forbidden" };

  if (!status) {
    return { error: "Invalid status" };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { managedStore: { select: { id: true } } },
  });

  if (!user?.managedStore) {
    return { error: "No store assigned" };
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, storeId: true, paymentStatus: true, status: true },
  });

  if (!order || order.storeId !== user.managedStore.id) {
    return { error: "Order not found or access denied" };
  }

  const allowedTransitions: Record<string, string[]> = {
    pending: ["preparing", "cancelled"],
    preparing: ["ready", "cancelled"],
    ready: ["delivered", "cancelled"],
  };

  const currentStatus = order.status;
  const nextStatus = status.toLowerCase();

  if (!allowedTransitions[currentStatus]?.includes(nextStatus)) {
    return { error: `Cannot change status from ${currentStatus} to ${nextStatus}` };
  }

  if (nextStatus !== "cancelled" && order.paymentStatus !== "paid") {
    return { error: "Only paid orders can be accepted" };
  }

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: { status: nextStatus },
    select: { id: true, status: true, total: true, paymentStatus: true, createdAt: true },
  });

  await logAction({
    userId: session.user.id,
    action: "STORE_ORDER_STATUS_UPDATE",
    entity: "Order",
    entityId: orderId,
    metadata: { oldStatus: currentStatus, newStatus: nextStatus },
  });

  revalidateTag("store-orders", "default");
  revalidateTag("orders", "default");

  return {
    success: true,
    order: {
      id: updated.id,
      status: updated.status,
      total: Number(updated.total).toFixed(2),
      paymentStatus: updated.paymentStatus,
      createdAt: updated.createdAt,
    },
  };
}
