"use server";

import { authorize, requirePermission } from "@/lib/authorize";
import { unstable_cache, revalidateTag } from "next/cache";
import prisma from "@/lib/prisma";
import { logAction } from "@/app/actions/audit";
import { createDishSchema } from "@/lib/validations/dish";
import { createDrinkSchema } from "@/lib/validations/drink";
import { createComboSchema } from "@/lib/validations/combo";
import { randomUUID } from "crypto";
import { uploadImage } from "@/lib/image-upload";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

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

// ─── Inventory types ───────────────────────────────────────────────────────────

type DishRow = {
  id: string;
  name: string;
  price: number;
  discountPrice: number | null;
  isAvailable: boolean;
  tag: string | null;
  imageUrl: string | null;
};

type DrinkRow = {
  id: string;
  name: string;
  price: number;
  discountPrice: number | null;
  isAvailable: boolean;
  tag: string | null;
  imageUrl: string | null;
};

type ComboRow = {
  id: string;
  name: string;
  price: number;
  originalPrice: number;
  isAvailable: boolean;
  imageUrl: string | null;
  items: string[];
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getManagedStoreId(sessionUserId: string) {
  const user = await prisma.user.findUnique({
    where: { id: sessionUserId },
    include: { managedStore: { select: { id: true } } },
  });
  if (!user?.managedStore) {
    return null;
  }
  return user.managedStore.id;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function deleteImage(url: string | null, deleteUrl: string | null) {
  if (!deleteUrl) return;
  try {
    await fetch(deleteUrl, { method: "DELETE", signal: AbortSignal.timeout(10000) });
  } catch {
    // ignore cleanup errors
  }
}

// ─── Dishes ───────────────────────────────────────────────────────────────────

export async function getStoreDishes() {
  const { authorized, session } = await authorize({ permissions: ["food:view"] });
  if (!authorized || !session?.user) return { error: "Forbidden" };

  const storeId = await getManagedStoreId(session.user.id);
  if (!storeId) return { error: "No store assigned" };

  const dishes = await unstable_cache(
    async () => {
      return prisma.dish.findMany({
        where: { storeId },
        select: { id: true, name: true, price: true, discountPrice: true, isAvailable: true, tag: true, imageUrl: true },
        orderBy: { createdAt: "desc" },
      });
    },
    ["store-dishes", storeId],
    { revalidate: 60, tags: ["store-inventory"] }
  )();

  return {
    dishes: dishes.map((d) => ({
      id: d.id,
      name: d.name,
      price: Number(d.price),
      discountPrice: d.discountPrice ? Number(d.discountPrice) : null,
      isAvailable: d.isAvailable,
      tag: d.tag,
      imageUrl: d.imageUrl,
    })) as DishRow[],
  };
}

export async function createStoreDish(formData: FormData): Promise<{ success: true; dish: DishRow } | { error: string }> {
  const { authorized, session } = await requirePermission("food:create");
  if (!authorized || !session?.user) return { error: "Forbidden" };

  const storeId = await getManagedStoreId(session.user.id);
  if (!storeId) return { error: "No store assigned" };

  const file = formData.get("image");
  if (!file || !(file instanceof File) || file.size === 0) {
    return { error: "Image is required" };
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { error: "Only JPG, PNG, WEBP, or GIF images are allowed" };
  }
  if (file.size > MAX_FILE_SIZE) {
    return { error: "Image must be 5MB or less" };
  }

  const parsed = createDishSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug") || undefined,
    price: formData.get("price"),
    discountPrice: formData.get("discountPrice") ? formData.get("discountPrice") : undefined,
    description: formData.get("description") || undefined,
    isAvailable: formData.get("isAvailable") === "true" || formData.get("isAvailable") === "on",
    tag: formData.get("tag") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const data = parsed.data;
  const { url: imageUrl, deleteUrl: imageDeleteUrl } = await uploadImage(file, { alt: data.name });

  let slug = data.slug?.trim() || slugify(data.name);
  const existing = await prisma.dish.findFirst({ where: { slug, storeId } });
  if (existing) {
    slug = `${slug}-${randomUUID().slice(0, 6)}`;
  }

  const dish = await prisma.dish.create({
    data: {
      name: data.name,
      slug,
      price: data.price,
      discountPrice: data.discountPrice,
      description: data.description,
      isAvailable: data.isAvailable,
      tag: data.tag,
      imageUrl,
      imageDeleteUrl,
      storeId,
    },
  });

  await logAction({
    userId: session.user.id,
    action: "STORE_CREATE_DISH",
    entity: "Dish",
    entityId: dish.id,
    metadata: { name: dish.name, storeId },
  });

  revalidateTag("store-inventory", "default");
  revalidateTag("dishes", "default");

  return {
    success: true,
    dish: {
      id: dish.id,
      name: dish.name,
      price: Number(dish.price),
      discountPrice: dish.discountPrice ? Number(dish.discountPrice) : null,
      isAvailable: dish.isAvailable,
      tag: dish.tag,
      imageUrl: dish.imageUrl,
    } as DishRow,
  };
}

export async function updateStoreDish(id: string, formData: FormData): Promise<{ success: true; dish: DishRow } | { error: string }> {
  const { authorized, session } = await requirePermission("food:update");
  if (!authorized || !session?.user) return { error: "Forbidden" };

  const storeId = await getManagedStoreId(session.user.id);
  if (!storeId) return { error: "No store assigned" };

  const existing = await prisma.dish.findFirst({ where: { id, storeId } });
  if (!existing) {
    return { error: "Dish not found" };
  }

  const parsed = createDishSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug") || undefined,
    price: formData.get("price"),
    discountPrice: formData.get("discountPrice") ? formData.get("discountPrice") : undefined,
    description: formData.get("description") || undefined,
    isAvailable: formData.get("isAvailable") === "true" || formData.get("isAvailable") === "on",
    tag: formData.get("tag") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const data = parsed.data;
  const file = formData.get("image");
  let imageUrl = existing.imageUrl;
  let imageDeleteUrl = existing.imageDeleteUrl;

  if (file && file instanceof File && file.size > 0) {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return { error: "Only JPG, PNG, WEBP, or GIF images are allowed" };
    }
    if (file.size > MAX_FILE_SIZE) {
      return { error: "Image must be 5MB or less" };
    }

    const { url: newImageUrl, deleteUrl: newDeleteUrl } = await uploadImage(file, { alt: data.name });
    imageUrl = newImageUrl;
    imageDeleteUrl = newDeleteUrl ?? null;

    if (existing.imageDeleteUrl) {
      await deleteImage(existing.imageUrl, existing.imageDeleteUrl);
    }
  }

  let slug = data.slug?.trim() || slugify(data.name);
  const slugConflict = await prisma.dish.findFirst({ where: { slug, storeId } });
  if (slugConflict && slugConflict.id !== id) {
    slug = `${slug}-${randomUUID().slice(0, 6)}`;
  }

  const dish = await prisma.dish.update({
    where: { id },
    data: {
      name: data.name,
      slug,
      price: data.price,
      discountPrice: data.discountPrice,
      description: data.description,
      isAvailable: data.isAvailable,
      tag: data.tag,
      imageUrl,
      imageDeleteUrl,
    },
  });

  await logAction({
    userId: session.user.id,
    action: "STORE_UPDATE_DISH",
    entity: "Dish",
    entityId: dish.id,
    metadata: { name: dish.name, storeId },
  });

  revalidateTag("store-inventory", "default");
  revalidateTag("dishes", "default");

  return {
    success: true,
    dish: {
      id: dish.id,
      name: dish.name,
      price: Number(dish.price),
      discountPrice: dish.discountPrice ? Number(dish.discountPrice) : null,
      isAvailable: dish.isAvailable,
      tag: dish.tag,
      imageUrl: dish.imageUrl,
    } as DishRow,
  };
}

export async function deleteStoreDish(id: string): Promise<{ success: true } | { error: string }> {
  const { authorized, session } = await requirePermission("food:delete");
  if (!authorized || !session?.user) return { error: "Forbidden" };

  const storeId = await getManagedStoreId(session.user.id);
  if (!storeId) return { error: "No store assigned" };

  const dish = await prisma.dish.findFirst({ where: { id, storeId } });
  if (!dish) {
    return { error: "Dish not found" };
  }

  await prisma.dish.delete({ where: { id } });
  await deleteImage(dish.imageUrl, dish.imageDeleteUrl);

  await logAction({
    userId: session.user.id,
    action: "STORE_DELETE_DISH",
    entity: "Dish",
    entityId: id,
    metadata: { name: dish.name, storeId },
  });

  revalidateTag("store-inventory", "default");
  revalidateTag("dishes", "default");

  return { success: true };
}

// ─── Drinks ───────────────────────────────────────────────────────────────────

export async function getStoreDrinks() {
  const { authorized, session } = await authorize({ permissions: ["food:view"] });
  if (!authorized || !session?.user) return { error: "Forbidden" };

  const storeId = await getManagedStoreId(session.user.id);
  if (!storeId) return { error: "No store assigned" };

  const drinks = await unstable_cache(
    async () => {
      return prisma.drink.findMany({
        where: { storeId },
        select: { id: true, name: true, price: true, discountPrice: true, isAvailable: true, tag: true, imageUrl: true },
        orderBy: { createdAt: "desc" },
      });
    },
    ["store-drinks", storeId],
    { revalidate: 60, tags: ["store-inventory"] }
  )();

  return {
    drinks: drinks.map((d) => ({
      id: d.id,
      name: d.name,
      price: Number(d.price),
      discountPrice: d.discountPrice ? Number(d.discountPrice) : null,
      isAvailable: d.isAvailable,
      tag: d.tag,
      imageUrl: d.imageUrl,
    })) as DrinkRow[],
  };
}

export async function createStoreDrink(formData: FormData): Promise<{ success: true; drink: DrinkRow } | { error: string }> {
  const { authorized, session } = await requirePermission("food:create");
  if (!authorized || !session?.user) return { error: "Forbidden" };

  const storeId = await getManagedStoreId(session.user.id);
  if (!storeId) return { error: "No store assigned" };

  const file = formData.get("image");
  if (!file || !(file instanceof File) || file.size === 0) {
    return { error: "Image is required" };
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { error: "Only JPG, PNG, WEBP, or GIF images are allowed" };
  }
  if (file.size > MAX_FILE_SIZE) {
    return { error: "Image must be 5MB or less" };
  }

  const parsed = createDrinkSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug") || undefined,
    price: formData.get("price"),
    discountPrice: formData.get("discountPrice") ? formData.get("discountPrice") : undefined,
    description: formData.get("description") || undefined,
    isAvailable: formData.get("isAvailable") === "true" || formData.get("isAvailable") === "on",
    tag: formData.get("tag") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const data = parsed.data;
  const { url: imageUrl, deleteUrl: imageDeleteUrl } = await uploadImage(file, { alt: data.name });

  let slug = data.slug?.trim() || slugify(data.name);
  const existing = await prisma.drink.findFirst({ where: { slug, storeId } });
  if (existing) {
    slug = `${slug}-${randomUUID().slice(0, 6)}`;
  }

  const drink = await prisma.drink.create({
    data: {
      name: data.name,
      slug,
      price: data.price,
      discountPrice: data.discountPrice,
      description: data.description,
      isAvailable: data.isAvailable,
      tag: data.tag,
      imageUrl,
      imageDeleteUrl,
      storeId,
    },
  });

  await logAction({
    userId: session.user.id,
    action: "STORE_CREATE_DRINK",
    entity: "Drink",
    entityId: drink.id,
    metadata: { name: drink.name, storeId },
  });

  revalidateTag("store-inventory", "default");
  revalidateTag("drinks", "default");

  return {
    success: true,
    drink: {
      id: drink.id,
      name: drink.name,
      price: Number(drink.price),
      discountPrice: drink.discountPrice ? Number(drink.discountPrice) : null,
      isAvailable: drink.isAvailable,
      tag: drink.tag,
      imageUrl: drink.imageUrl,
    } as DrinkRow,
  };
}

export async function updateStoreDrink(id: string, formData: FormData): Promise<{ success: true; drink: DrinkRow } | { error: string }> {
  const { authorized, session } = await requirePermission("food:update");
  if (!authorized || !session?.user) return { error: "Forbidden" };

  const storeId = await getManagedStoreId(session.user.id);
  if (!storeId) return { error: "No store assigned" };

  const existing = await prisma.drink.findFirst({ where: { id, storeId } });
  if (!existing) {
    return { error: "Drink not found" };
  }

  const parsed = createDrinkSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug") || undefined,
    price: formData.get("price"),
    discountPrice: formData.get("discountPrice") ? formData.get("discountPrice") : undefined,
    description: formData.get("description") || undefined,
    isAvailable: formData.get("isAvailable") === "true" || formData.get("isAvailable") === "on",
    tag: formData.get("tag") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const data = parsed.data;
  const file = formData.get("image");
  let imageUrl = existing.imageUrl;
  let imageDeleteUrl = existing.imageDeleteUrl;

  if (file && file instanceof File && file.size > 0) {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return { error: "Only JPG, PNG, WEBP, or GIF images are allowed" };
    }
    if (file.size > MAX_FILE_SIZE) {
      return { error: "Image must be 5MB or less" };
    }

    const { url: newImageUrl, deleteUrl: newDeleteUrl } = await uploadImage(file, { alt: data.name });
    imageUrl = newImageUrl;
    imageDeleteUrl = newDeleteUrl ?? null;

    if (existing.imageDeleteUrl) {
      await deleteImage(existing.imageUrl, existing.imageDeleteUrl);
    }
  }

  let slug = data.slug?.trim() || slugify(data.name);
  const slugConflict = await prisma.drink.findFirst({ where: { slug, storeId } });
  if (slugConflict && slugConflict.id !== id) {
    slug = `${slug}-${randomUUID().slice(0, 6)}`;
  }

  const drink = await prisma.drink.update({
    where: { id },
    data: {
      name: data.name,
      slug,
      price: data.price,
      discountPrice: data.discountPrice,
      description: data.description,
      isAvailable: data.isAvailable,
      tag: data.tag,
      imageUrl,
      imageDeleteUrl,
    },
  });

  await logAction({
    userId: session.user.id,
    action: "STORE_UPDATE_DRINK",
    entity: "Drink",
    entityId: drink.id,
    metadata: { name: drink.name, storeId },
  });

  revalidateTag("store-inventory", "default");
  revalidateTag("drinks", "default");

  return {
    success: true,
    drink: {
      id: drink.id,
      name: drink.name,
      price: Number(drink.price),
      discountPrice: drink.discountPrice ? Number(drink.discountPrice) : null,
      isAvailable: drink.isAvailable,
      tag: drink.tag,
      imageUrl: drink.imageUrl,
    } as DrinkRow,
  };
}

export async function deleteStoreDrink(id: string): Promise<{ success: true } | { error: string }> {
  const { authorized, session } = await requirePermission("food:delete");
  if (!authorized || !session?.user) return { error: "Forbidden" };

  const storeId = await getManagedStoreId(session.user.id);
  if (!storeId) return { error: "No store assigned" };

  const drink = await prisma.drink.findFirst({ where: { id, storeId } });
  if (!drink) {
    return { error: "Drink not found" };
  }

  await prisma.drink.delete({ where: { id } });
  await deleteImage(drink.imageUrl, drink.imageDeleteUrl);

  await logAction({
    userId: session.user.id,
    action: "STORE_DELETE_DRINK",
    entity: "Drink",
    entityId: id,
    metadata: { name: drink.name, storeId },
  });

  revalidateTag("store-inventory", "default");
  revalidateTag("drinks", "default");

  return { success: true };
}

// ─── Combos ───────────────────────────────────────────────────────────────────

export async function getStoreCombos() {
  const { authorized, session } = await authorize({ permissions: ["food:view"] });
  if (!authorized || !session?.user) return { error: "Forbidden" };

  const storeId = await getManagedStoreId(session.user.id);
  if (!storeId) return { error: "No store assigned" };

  const combos = await unstable_cache(
    async () => {
      return prisma.combo.findMany({
        where: { storeId },
        select: { id: true, name: true, price: true, originalPrice: true, isAvailable: true, imageUrl: true, items: true },
        orderBy: { createdAt: "desc" },
      });
    },
    ["store-combos", storeId],
    { revalidate: 60, tags: ["store-inventory"] }
  )();

  return {
    combos: combos.map((c) => ({
      id: c.id,
      name: c.name,
      price: Number(c.price),
      originalPrice: Number(c.originalPrice),
      isAvailable: c.isAvailable,
      imageUrl: c.imageUrl,
      items: c.items,
    })) as ComboRow[],
  };
}

export async function createStoreCombo(formData: FormData): Promise<{ success: true; combo: ComboRow } | { error: string }> {
  const { authorized, session } = await requirePermission("food:create");
  if (!authorized || !session?.user) return { error: "Forbidden" };

  const storeId = await getManagedStoreId(session.user.id);
  if (!storeId) return { error: "No store assigned" };

  const file = formData.get("image");
  if (!file || !(file instanceof File) || file.size === 0) {
    return { error: "Image is required" };
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { error: "Only JPG, PNG, WEBP, or GIF images are allowed" };
  }
  if (file.size > MAX_FILE_SIZE) {
    return { error: "Image must be 5MB or less" };
  }

  const rawItems = formData.get("items");
  const items = typeof rawItems === "string" ? rawItems.split(",").map((s) => s.trim()).filter(Boolean) : [];

  const parsed = createComboSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug") || undefined,
    items,
    price: formData.get("price"),
    originalPrice: formData.get("originalPrice"),
    isAvailable: formData.get("isAvailable") === "true" || formData.get("isAvailable") === "on",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const data = parsed.data;
  const { url: imageUrl, deleteUrl: imageDeleteUrl } = await uploadImage(file, { alt: data.name });

  let slug = data.slug?.trim() || slugify(data.name);
  const existing = await prisma.combo.findFirst({ where: { slug, storeId } });
  if (existing) {
    slug = `${slug}-${randomUUID().slice(0, 6)}`;
  }

  const combo = await prisma.combo.create({
    data: {
      name: data.name,
      slug,
      items: data.items,
      price: data.price,
      originalPrice: data.originalPrice,
      isAvailable: data.isAvailable,
      imageUrl,
      imageDeleteUrl,
      storeId,
    },
  });

  await logAction({
    userId: session.user.id,
    action: "STORE_CREATE_COMBO",
    entity: "Combo",
    entityId: combo.id,
    metadata: { name: combo.name, storeId },
  });

  revalidateTag("store-inventory", "default");
  revalidateTag("combos", "default");

  return {
    success: true,
    combo: {
      id: combo.id,
      name: combo.name,
      price: Number(combo.price),
      originalPrice: Number(combo.originalPrice),
      isAvailable: combo.isAvailable,
      imageUrl: combo.imageUrl,
      items: combo.items,
    } as ComboRow,
  };
}

export async function updateStoreCombo(id: string, formData: FormData): Promise<{ success: true; combo: ComboRow } | { error: string }> {
  const { authorized, session } = await requirePermission("food:update");
  if (!authorized || !session?.user) return { error: "Forbidden" };

  const storeId = await getManagedStoreId(session.user.id);
  if (!storeId) return { error: "No store assigned" };

  const existing = await prisma.combo.findFirst({ where: { id, storeId } });
  if (!existing) {
    return { error: "Combo not found" };
  }

  const rawItems = formData.get("items");
  const items = typeof rawItems === "string" ? rawItems.split(",").map((s) => s.trim()).filter(Boolean) : [];

  const parsed = createComboSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug") || undefined,
    items,
    price: formData.get("price"),
    originalPrice: formData.get("originalPrice"),
    isAvailable: formData.get("isAvailable") === "true" || formData.get("isAvailable") === "on",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const data = parsed.data;
  const file = formData.get("image");
  let imageUrl = existing.imageUrl;
  let imageDeleteUrl = existing.imageDeleteUrl;

  if (file && file instanceof File && file.size > 0) {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return { error: "Only JPG, PNG, WEBP, or GIF images are allowed" };
    }
    if (file.size > MAX_FILE_SIZE) {
      return { error: "Image must be 5MB or less" };
    }

    const { url: newImageUrl, deleteUrl: newDeleteUrl } = await uploadImage(file, { alt: data.name });
    imageUrl = newImageUrl;
    imageDeleteUrl = newDeleteUrl ?? null;

    if (existing.imageDeleteUrl) {
      await deleteImage(existing.imageUrl, existing.imageDeleteUrl);
    }
  }

  let slug = data.slug?.trim() || slugify(data.name);
  const slugConflict = await prisma.combo.findFirst({ where: { slug, storeId } });
  if (slugConflict && slugConflict.id !== id) {
    slug = `${slug}-${randomUUID().slice(0, 6)}`;
  }

  const combo = await prisma.combo.update({
    where: { id },
    data: {
      name: data.name,
      slug,
      items: data.items,
      price: data.price,
      originalPrice: data.originalPrice,
      isAvailable: data.isAvailable,
      imageUrl,
      imageDeleteUrl,
    },
  });

  await logAction({
    userId: session.user.id,
    action: "STORE_UPDATE_COMBO",
    entity: "Combo",
    entityId: combo.id,
    metadata: { name: combo.name, storeId },
  });

  revalidateTag("store-inventory", "default");
  revalidateTag("combos", "default");

  return {
    success: true,
    combo: {
      id: combo.id,
      name: combo.name,
      price: Number(combo.price),
      originalPrice: Number(combo.originalPrice),
      isAvailable: combo.isAvailable,
      imageUrl: combo.imageUrl,
      items: combo.items,
    } as ComboRow,
  };
}

export async function deleteStoreCombo(id: string): Promise<{ success: true } | { error: string }> {
  const { authorized, session } = await requirePermission("food:delete");
  if (!authorized || !session?.user) return { error: "Forbidden" };

  const storeId = await getManagedStoreId(session.user.id);
  if (!storeId) return { error: "No store assigned" };

  const combo = await prisma.combo.findFirst({ where: { id, storeId } });
  if (!combo) {
    return { error: "Combo not found" };
  }

  await prisma.combo.delete({ where: { id } });
  await deleteImage(combo.imageUrl, combo.imageDeleteUrl);

  await logAction({
    userId: session.user.id,
    action: "STORE_DELETE_COMBO",
    entity: "Combo",
    entityId: id,
    metadata: { name: combo.name, storeId },
  });

  revalidateTag("store-inventory", "default");
  revalidateTag("combos", "default");

  return { success: true };
}
